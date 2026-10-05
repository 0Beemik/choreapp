import { createHash, randomUUID } from 'node:crypto';

export const uuid = () => randomUUID();
export const sha256 = async (text: string) => createHash('sha256').update(text).digest('hex');
