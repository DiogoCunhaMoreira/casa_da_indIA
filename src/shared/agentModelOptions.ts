/** Collapse aliases for the engine default and preserve an uncatalogued current model. */
export function agentModelOptions(
  catalog: Array<{ id?: string; label: string }>,
  current: string | undefined,
  defaultLabel: string
): Array<{ id: string; label: string }> {
  const options = new Map<string, string>([['', defaultLabel]]);
  for (const option of catalog) {
    if (!option.id || options.has(option.id)) continue;
    options.set(option.id, option.label);
  }
  if (current && !options.has(current)) options.set(current, current);
  return [...options].map(([id, label]) => ({ id, label }));
}
