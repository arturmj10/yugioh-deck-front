export const FILTROS_CATALOGO_INICIAL = {
  tipoPrincipal: 'Todos',
  subTipo: 'Todos',
  atributo: 'Todos',
  race: 'Todos',
  level: 'Todos',
  atkMin: '',
  atkMax: '',
  defMin: '',
  defMax: '',
};

export function filterCatalogCards(cards, inputTexto, filtros) {
  return cards.filter((card) => {
    const raw = card.raw || {};
    const type = (card.type || raw.type || raw.Type || '').toString();
    const attribute = (card.attribute || raw.attribute || raw.Attribute || '').toString();
    const race = (card.race || raw.race || raw.Race || '').toString();
    const level = card.level ?? raw.level ?? raw.Level ?? null;
    const atk = card.atk ?? raw.atk ?? raw.Atk ?? raw.ATK ?? -1;
    const def = card.def ?? raw.def ?? raw.Def ?? raw.DEF ?? -1;
    const nome = (card.nome || card.name || raw.name || raw.Name || '')
      .toString()
      .toLowerCase();

    const bateTexto = inputTexto
      ? nome.includes(inputTexto.trim().toLowerCase())
      : true;

    let bateTipoPrincipal = true;
    if (filtros.tipoPrincipal === 'Magias') {
      bateTipoPrincipal = /Spell Card/i.test(type);
    } else if (filtros.tipoPrincipal === 'Armadilhas') {
      bateTipoPrincipal = /Trap Card/i.test(type);
    } else if (filtros.tipoPrincipal === 'Monstros') {
      bateTipoPrincipal = !/Spell|Trap/i.test(type);
    }

    let bateSubTipo = true;
    if (filtros.subTipo !== 'Todos') {
      bateSubTipo = type.toLowerCase().includes(filtros.subTipo.toLowerCase());
    }

    const bateAtributo =
      filtros.atributo === 'Todos' || attribute === filtros.atributo;
    const bateRace = filtros.race === 'Todos' || race === filtros.race;
    const bateLevel =
      filtros.level === 'Todos' ||
      (level !== null &&
        level !== undefined &&
        parseInt(level, 10) === parseInt(filtros.level, 10));
    const bateAtkMin = filtros.atkMin
      ? atk !== -1 && atk >= parseInt(filtros.atkMin, 10)
      : true;
    const bateAtkMax = filtros.atkMax
      ? atk !== -1 && atk <= parseInt(filtros.atkMax, 10)
      : true;
    const bateDefMin = filtros.defMin
      ? def !== -1 && def >= parseInt(filtros.defMin, 10)
      : true;
    const bateDefMax = filtros.defMax
      ? def !== -1 && def <= parseInt(filtros.defMax, 10)
      : true;

    return (
      bateTexto &&
      bateTipoPrincipal &&
      bateSubTipo &&
      bateAtributo &&
      bateRace &&
      bateLevel &&
      bateAtkMin &&
      bateAtkMax &&
      bateDefMin &&
      bateDefMax
    );
  });
}
