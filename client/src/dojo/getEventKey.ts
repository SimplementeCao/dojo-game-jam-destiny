import { getSelectorFromTag } from "@dojoengine/utils";

const DOJO_NAMESPACE = "destiny";

export const getEventKey = (eventName: string) => {
  return getSelectorFromTag(DOJO_NAMESPACE, eventName);
};
