import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings

logger = logging.getLogger(__name__)

PROD_COLLECTION_NAME = "knowledge_production"
DEMO_COLLECTION_NAME = "knowledge_demo"

class ChromaKnowledgeService:
    """
    Multi-Tenant Regulatory & Tariff Knowledge Service using native ChromaDB.
    
    PRIMARY ARCHITECTURAL INVARIANTS:
    1. Multi-Tenant Scoping: Queries strictly enforce tenant boundaries in vector space:
       where={"$or": [{"org_id": "GLOBAL_PUBLIC"}, {"org_id": org_id}]}
    2. Collection-Level Demo Isolation:
       - Production collection: 'knowledge_production' (contains production circulars/tariffs only;
         never contains sample or demo negotiated tariffs).
       - Demo collection: 'knowledge_demo' (contains sample fixtures marked with is_demo=True).
       - Production environments are strictly forbidden from querying 'knowledge_demo'.
    3. Defense-in-depth: org_id is provided by the authenticated core (Express) and
       is never accepted blindly from untrusted client requests.
    """
    _client = None
    _prod_collection = None
    _demo_collection = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            os.makedirs(settings.chroma_db_dir, exist_ok=True)
            cls._client = chromadb.PersistentClient(
                path=settings.chroma_db_dir,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
        return cls._client

    @classmethod
    def get_production_collection(cls):
        if cls._prod_collection is None:
            client = cls.get_client()
            cls._prod_collection = client.get_or_create_collection(
                name=PROD_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            cls._seed_production_fixtures(cls._prod_collection)
        return cls._prod_collection

    @classmethod
    def get_demo_collection(cls):
        if cls._demo_collection is None:
            client = cls.get_client()
            cls._demo_collection = client.get_or_create_collection(
                name=DEMO_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            cls._seed_demo_fixtures(cls._demo_collection)
        return cls._demo_collection

    @classmethod
    def _seed_production_fixtures(cls, collection):
        """Seeds real, verified public port circulars into production collection."""
        existing = collection.get(ids=["prod_global_jnpt_tariff"])
        if existing and existing["ids"]:
            return

        docs = [
            "Jawaharlal Nehru Port Trust (JNPT) Container Tariff Schedule. Import laden 20ft dry containers receive 3 calendar free days from vessel discharge. Demurrage rate after free days: Days 4-7 at INR 2,500/day; Days 8+ at INR 5,000/day. 40ft containers are charged double (INR 5,000 and INR 10,000).",
            "Indian Customs CBIC Public Notice No. 16/2016 regarding Direct Port Delivery (DPD). Importers having AEO accreditation are granted 48 hours to clear cargo from the port terminal directly. If out of charge is not obtained within 48 hours, terminal operators are instructed to shift the container to designated CFS en-bloc."
        ]
        metadatas = [
            {"org_id": "GLOBAL_PUBLIC", "category": "PORT_TARIFF", "title": "JNPT Standard Demurrage Slabs", "is_demo": False, "environment": "production"},
            {"org_id": "GLOBAL_PUBLIC", "category": "CUSTOMS_CIRCULAR", "title": "CBIC DPD 48-Hour Clearance Guidelines", "is_demo": False, "environment": "production"}
        ]
        ids = ["prod_global_jnpt_tariff", "prod_global_cbic_dpd_notice"]
        collection.add(documents=docs, metadatas=metadatas, ids=ids)
        logger.info("Production knowledge fixtures seeded into %s.", PROD_COLLECTION_NAME)

    @classmethod
    def _seed_demo_fixtures(cls, collection):
        """Seeds demo fixtures explicitly marked with is_demo=True into demo collection."""
        existing = collection.get(ids=["demo_global_jnpt_tariff"])
        if existing and existing["ids"]:
            return

        docs = [
            "Sample JNPT Container Tariff Schedule for Demonstration. Import laden 20ft dry containers receive 3 calendar free days from discharge. Demurrage rate after free days: Days 4-7 at INR 2,500/day; Days 8+ at INR 5,000/day.",
            "Sample Indian Customs Public Notice No. 16/2016 regarding Direct Port Delivery (DPD). Importers having AEO accreditation are granted 48 hours to clear cargo directly from the port terminal.",
            "Sample Apex Global Logistics Negotiated Carrier Rebate Agreement with Maersk Line under Organization 00000000-0000-0000-0000-000000000001. Containers qualify for 14 free days demurrage at Nhava Sheva instead of standard 3 days.",
            "Sample Competitor Maritime Private Rebate Agreement with MSC under Organization 99999999-9999-9999-9999-999999999999. Strict 21 free days on refrigerated reefers with 40% rebate on demurrage tariffs."
        ]
        metadatas = [
            {"org_id": "GLOBAL_PUBLIC", "category": "PORT_TARIFF", "title": "Demo JNPT Slabs", "is_demo": True, "environment": "demo"},
            {"org_id": "GLOBAL_PUBLIC", "category": "CUSTOMS_CIRCULAR", "title": "Demo CBIC Guidelines", "is_demo": True, "environment": "demo"},
            {"org_id": "00000000-0000-0000-0000-000000000001", "category": "PRIVATE_CUSTOMER_REBATE", "title": "Demo Apex Logistics Carrier Rebate", "is_demo": True, "environment": "demo"},
            {"org_id": "99999999-9999-9999-9999-999999999999", "category": "PRIVATE_CUSTOMER_REBATE", "title": "Demo Competitor Rebate", "is_demo": True, "environment": "demo"}
        ]
        ids = [
            "demo_global_jnpt_tariff",
            "demo_global_customs_dpd_circular",
            "demo_private_apex_logistics_rebate",
            "demo_private_competitor_rebate"
        ]
        collection.add(documents=docs, metadatas=metadatas, ids=ids)
        logger.info("Demo knowledge fixtures seeded into %s.", DEMO_COLLECTION_NAME)

    @classmethod
    def query(cls, query_text: str, org_id: str, n_results: int = 3, include_demo: bool = False) -> List[Dict[str, Any]]:
        """
        Executes a tenant-isolated vector search in ChromaDB.
        Enforces where filter: $or: [{'org_id': 'GLOBAL_PUBLIC'}, {'org_id': org_id}]
        """
        # Hard isolation barrier: Production environment NEVER queries demo collection
        if settings.environment.lower() == "production":
            include_demo = False

        collection = cls.get_demo_collection() if include_demo else cls.get_production_collection()

        # Enforce multi-tenant scoping boundary
        where_filter = {
            "$or": [
                {"org_id": "GLOBAL_PUBLIC"},
                {"org_id": org_id}
            ]
        }

        results = collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where_filter
        )

        formatted: List[Dict[str, Any]] = []
        if not results or not results["ids"] or not results["ids"][0]:
            return formatted

        count = len(results["ids"][0])
        for idx in range(count):
            doc_id = results["ids"][0][idx]
            doc_text = results["documents"][0][idx] if results["documents"] else ""
            doc_meta = results["metadatas"][0][idx] if results["metadatas"] else {}
            distance = results["distances"][0][idx] if results.get("distances") and results["distances"] else None

            formatted.append({
                "id": doc_id,
                "text": doc_text,
                "metadata": doc_meta,
                "distance": float(distance) if distance is not None else None
            })

        return formatted
