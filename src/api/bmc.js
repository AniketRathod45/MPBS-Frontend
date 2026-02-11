import { societies } from "../mock/bmcMock";

export async function fetchSocieties(session) {
  await new Promise(res => setTimeout(res, 300));
  return societies.filter(s => s.session === session);
}

export async function submitVerification({
  societyId,
  finalEntry,
}) {
  await new Promise(res => setTimeout(res, 400));

  const society = societies.find(s => s.id === societyId);
  if (!society || society.verified) {
    return { success: false };
  }

  society.entry = finalEntry;
  society.verified = true;

  return { success: true };
}
