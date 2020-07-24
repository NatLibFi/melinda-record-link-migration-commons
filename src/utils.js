export function sortSubfields(order, subfields, orderedSubfields = []) {
  const [code, ...rest] = order;
  if (code === undefined) {
    return [...orderedSubfields, ...subfields];
  }

  const filtered = subfields.filter(sub => sub.code === code);
  const restSubfields = subfields.filter(sub => sub.code !== code);
  if (filtered.length > 0) {
    return sortSubfields(rest, restSubfields, [...orderedSubfields, ...filtered]);
  }

  return sortSubfields(rest, restSubfields, orderedSubfields);
}
