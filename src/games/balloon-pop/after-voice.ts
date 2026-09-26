/** Респаун поля — только после текущей фразы Мяу, чтобы голос не обрывался. */
export async function runAfterCurrentVoice(
  wait: () => Promise<void>,
  action: () => void,
  isAlive: () => boolean,
): Promise<void> {
  await wait()
  if (!isAlive()) return
  action()
}
