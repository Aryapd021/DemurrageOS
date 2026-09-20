import { PrismaClient, Role, DeliveryMode, ContainerStatus, ChargeType, TaskType, AssigneeType, DocumentType, ExtractionStatus, ReviewStatus, ComplianceSignalType, SignalSource } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding DemurrageOS Database ---');

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Apex Global Logistics & CHA Services'
    }
  });

  // 2. Users
  const chaUser = await prisma.user.upsert({
    where: { email: 'cha@apexlogistics.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      organizationId: org.id,
      email: 'cha@apexlogistics.com',
      name: 'Vikram Mehta (Lead CHA)',
      role: Role.CHA
    }
  });

  // 3. CFS Terminals
  const cfs1 = await prisma.cFS.upsert({
    where: {
      organizationId_code: {
        organizationId: org.id,
        code: 'NS-CFS-01'
      }
    },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      organizationId: org.id,
      name: 'Nhava Sheva Gateway CFS',
      code: 'NS-CFS-01',
      location: 'JNPT, Navi Mumbai',
      groundRentFreeDays: 3
    }
  });

  // 4. Clients
  // Client A: Dual-accredited AEO + ACP
  const clientTata = await prisma.client.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      organizationId: org.id,
      name: 'Tata Electronics Private Limited',
      iecCode: '0388019283',
      gstin: '27AAACT2819M1Z8',
      aeoStatus: true,
      acpStatus: true,
      contactName: 'Anand Kulkarni',
      contactEmail: 'anand.k@tataelectronics.com',
      contactPhone: '+91 9820123456'
    }
  });

  // Client B: AEO accredited only
  const clientReliance = await prisma.client.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      organizationId: org.id,
      name: 'Reliance Retail Ventures',
      iecCode: '0399182736',
      gstin: '27AAACR1234F1Z2',
      aeoStatus: true,
      acpStatus: false,
      contactName: 'Pooja Shah',
      contactEmail: 'pooja.s@relianceretail.com'
    }
  });

  // Client C: Unaccredited
  const clientPinnacle = await prisma.client.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      organizationId: org.id,
      name: 'Pinnacle Auto Parts LLP',
      iecCode: '0377481920',
      gstin: '27AAACP9988P1Z5',
      aeoStatus: false,
      acpStatus: false,
      contactName: 'Rohit Sharma',
      contactEmail: 'rohit@pinnacleauto.in'
    }
  });

  // 5. Tariffs (Carrier Demurrage & CFS Ground Rent)
  await prisma.tariff.deleteMany({ where: { organizationId: org.id } });

  await prisma.tariff.createMany({
    data: [
      // Carrier Demurrage
      { organizationId: org.id, carrier: 'MAERSK', chargeType: ChargeType.DEMURRAGE, slabDaysStart: 1, slabDaysEnd: 3, ratePerDay20: 0, ratePerDay40: 0, currency: 'INR' },
      { organizationId: org.id, carrier: 'MAERSK', chargeType: ChargeType.DEMURRAGE, slabDaysStart: 4, slabDaysEnd: 7, ratePerDay20: 2500, ratePerDay40: 5000, currency: 'INR' },
      { organizationId: org.id, carrier: 'MAERSK', chargeType: ChargeType.DEMURRAGE, slabDaysStart: 8, slabDaysEnd: 999, ratePerDay20: 5000, ratePerDay40: 10000, currency: 'INR' },
      // CFS Ground Rent
      { organizationId: org.id, cfsId: cfs1.id, chargeType: ChargeType.CFS_GROUND_RENT, slabDaysStart: 1, slabDaysEnd: 3, ratePerDay20: 0, ratePerDay40: 0, currency: 'INR' },
      { organizationId: org.id, cfsId: cfs1.id, chargeType: ChargeType.CFS_GROUND_RENT, slabDaysStart: 4, slabDaysEnd: 10, ratePerDay20: 1200, ratePerDay40: 2400, currency: 'INR' },
      { organizationId: org.id, cfsId: cfs1.id, chargeType: ChargeType.CFS_GROUND_RENT, slabDaysStart: 11, slabDaysEnd: 999, ratePerDay20: 2500, ratePerDay40: 5000, currency: 'INR' }
    ]
  });

  // 6. Historical Data for Tata Electronics (HS 8471.30)
  const pastDates = [10, 25, 45, 75, 110];
  for (let i = 0; i < pastDates.length; i++) {
    const d = new Date();
    d.setDate(d.getDate() - pastDates[i]);
    await prisma.container.create({
      data: {
        organizationId: org.id,
        clientId: clientTata.id,
        containerNumber: `MSCU${1000000 + i}`,
        carrier: 'MAERSK',
        hsCode: '8471.30',
        declaredValue: 4500000 + (i * 50000),
        currency: 'INR',
        dischargeDate: d,
        status: ContainerStatus.DELIVERED,
        deliveryMode: DeliveryMode.DPD_CFS,
        createdAt: d
      }
    });
  }

  // 7. Active At-Risk Container (CSQU3054383)
  const now = new Date();
  const dischargeDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // Discharged 4 days ago
  const freeTimeExpiresAt = new Date(now.getTime() + 14 * 60 * 60 * 1000); // 14 hours remaining!

  const atRiskContainer = await prisma.container.upsert({
    where: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    update: {},
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      organizationId: org.id,
      clientId: clientTata.id,
      containerNumber: 'CSQU3054383',
      containerType: 'DRY',
      size: 40,
      status: ContainerStatus.DISCHARGED,
      deliveryMode: DeliveryMode.DPD_CFS,
      carrier: 'MAERSK',
      cfsId: cfs1.id,
      billOfLading: 'MEDU192837465',
      declaredValue: 4650000,
      currency: 'INR',
      hsCode: '8471.30',
      dischargeDate,
      freeTimeExpiresAt
    }
  });

  // 8. Add Container Events
  await prisma.containerEvent.createMany({
    data: [
      {
        containerId: atRiskContainer.id,
        eventType: 'VESSEL_DISCHARGE',
        location: 'JNPT Port Terminal',
        source: 'TERMINAL_EDI',
        timestamp: dischargeDate
      },
      {
        containerId: atRiskContainer.id,
        eventType: 'CUSTOMS_ASSESSMENT_COMPLETED',
        location: 'Customs Air/Sea Cargo Complex',
        source: 'ICEGATE',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  // 9. Compliance Signals for At-Risk Container
  await prisma.complianceSignal.createMany({
    data: [
      {
        containerId: atRiskContainer.id,
        signalType: ComplianceSignalType.AEO_ACP_STATUS,
        score: 100,
        source: SignalSource.DERIVED,
        reason: 'Client is dual-accredited (AEO Certified & ACP Program enrolled)'
      },
      {
        containerId: atRiskContainer.id,
        signalType: ComplianceSignalType.HS_CODE_NOVELTY,
        score: 95,
        source: SignalSource.DERIVED,
        reason: 'Frequent routine filings for HS code 8471.30 (5 historical shipments)'
      },
      {
        containerId: atRiskContainer.id,
        signalType: ComplianceSignalType.VALUATION_CONSISTENCY,
        score: 95,
        source: SignalSource.DERIVED,
        reason: 'Declared value (₹4,650,000) is consistent with historical baseline'
      },
      {
        containerId: atRiskContainer.id,
        signalType: ComplianceSignalType.DOC_COMPLETENESS,
        score: 33,
        source: SignalSource.DERIVED,
        reason: 'Documentation incomplete: missing Delivery Order and Bill of Entry'
      }
    ]
  });

  // 10. External Task with 72-Hour Token
  const rawToken = '7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a';
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.task.create({
    data: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      organizationId: org.id,
      containerId: atRiskContainer.id,
      title: 'Authorize and Schedule Container Pickup with Transporter',
      description: 'Free time expires in 14 hours. Transporter must confirm truck dispatch.',
      taskType: TaskType.PICKUP,
      assigneeType: AssigneeType.EXTERNAL_CONTACT,
      externalContactName: 'Ramesh Kumar (Highway Freightways)',
      externalContactPhone: '+91 9876543210',
      externalContactEmail: 'ramesh.trucking@example.com',
      pickupLocation: 'Nhava Sheva Gateway CFS, Gate 2',
      scheduledDate: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      confirmationTokenHash: tokenHash,
      tokenExpiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000)
    }
  });

  // 11. Initial Alert
  await prisma.alert.create({
    data: {
      organizationId: org.id,
      containerId: atRiskContainer.id,
      severity: 'HIGH',
      title: 'Elevated Demurrage Risk: CSQU3054383',
      message: 'Free time expires in 14 hours. Missing Delivery Order verification.'
    }
  });

  console.log('--- Seeding completed successfully! ---');
  console.log(`Demo container ID: ${atRiskContainer.id} (CSQU3054383)`);
  console.log(`Demo external token: ${rawToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
