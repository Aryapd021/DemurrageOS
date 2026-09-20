import { z } from 'zod';

export interface KnowledgeItemDto {
  id: string;
  text: string;
  metadata: {
    org_id: string;
    category?: string;
    title?: string;
    is_demo?: boolean;
    [key: string]: any;
  };
  distance?: number | null;
}

export interface KnowledgeQueryRequestDto {
  query: string;
  nResults?: number;
  includeDemo?: boolean;
}

export interface KnowledgeQueryResponseDto {
  success: boolean;
  query: string;
  org_id: string;
  results: KnowledgeItemDto[];
}

export const KnowledgeQueryRequestSchema = z.object({
  query: z.string().min(2),
  nResults: z.number().int().min(1).max(10).optional().default(3),
  includeDemo: z.boolean().optional().default(false)
});
