import { z } from 'zod';

export const CreateRoomSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be at most 50 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  maxPlayers: z.number().int().min(2, 'At least 2 players required').max(8, 'At most 8 players allowed'),
  isPrivate: z.boolean(),
});

export type CreateRoom = z.infer<typeof CreateRoomSchema>;

export const UpdateRoomSchema = CreateRoomSchema.partial();

export type UpdateRoom = z.infer<typeof UpdateRoomSchema>;

export const JoinRoomSchema = z.object({
  code: z
    .string()
    .min(1, 'Le code est requis')
    .length(6, 'Le code doit faire exactement 6 caractères')
    .transform((v) => v.toUpperCase().trim()),
});

export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;
