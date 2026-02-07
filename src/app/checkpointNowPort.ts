import { createPersistencePort } from "@/domainE/persistence";

const persistence = createPersistencePort();

export const checkpointNowPort = {
  async checkpointNow(args: { saveId: string; state: any; txLog: any[] }): Promise<{ checkpointId: string }> {
    // txLog currently unused by persistence (events live in state.events.log)
    const integrity = await persistence.createCheckpoint(args.saveId, args.state, { appendCheckpointEvent: true });
    await persistence.save(args.saveId, args.state);
    return { checkpointId: integrity.checkpointId };
  },
};
