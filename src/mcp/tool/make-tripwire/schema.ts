import { z } from 'zod';

// Input schema for the trip wire tool
const tripwireSchema = z.object({
  options: z.array(z.object({
    id: z.string().describe("Unique identifier for the option"),
    name: z.string().describe("Name of the option"),
    description: z.string().describe("Description of what this option entails")
  })).min(1).describe("List of options to create trip wires for")
});

// Output schema for structured response
const outputSchema = z.object({
  tripwires: z.array(z.object({
    optionId: z.string().describe("ID of the option this trip wire belongs to"),
    optionName: z.string().describe("Name of the option"),
    criteria: z.array(z.object({
      id: z.string().describe("Unique identifier for the criterion"),
      description: z.string().describe("Description of the withdrawal criterion"),
      type: z.enum(['performance', 'cost', 'risk', 'timeline', 'quality', 'other']).describe("Category of the criterion"),
      threshold: z.string().describe("Specific threshold or condition that triggers withdrawal"),
      severity: z.enum(['low', 'medium', 'high', 'critical']).describe("Severity level of this criterion")
    })).describe("List of withdrawal criteria for this option")
  })).describe("Trip wire criteria for each option"),
  metadata: z.object({
    generatedAt: z.string().describe("ISO timestamp when the trip wires were generated"),
    totalOptions: z.number().describe("Total number of options analyzed"),
    totalCriteria: z.number().describe("Total number of criteria generated"),
    note: z.string().optional().describe("Additional notes about the generation process")
  }).describe("Metadata about the trip wire generation")
});

export const tripwireParams = tripwireSchema.shape;
export const tripwireOutputSchema = outputSchema;
export type TripwireParams = z.infer<typeof tripwireSchema>;
export type TripwireOutput = z.infer<typeof outputSchema>;