import type { Answer, Result, Sources, Storage } from './app.contract.d.ts';

export const grants = 'fs.read app:/data/foods.json\nfs.write app:/data/foods.json';

type Item = Result<'loadFoods'>[number];
const FILE = 'app:/data/foods.json';
const DEFAULTS: Item[] = [
  { id: '1', title: 'Burger' },
  { id: '2', title: 'BBQ' },
  { id: '3', title: 'Pizza' },
  { id: '4', title: 'Ramen' },
  { id: '5', title: 'Sushi' },
  { id: '6', title: 'Pasta' },
];

const load = (storage: Storage): Promise<Item[]> => storage.fs.readFile(FILE).then(
  (bytes) => JSON.parse(new TextDecoder().decode(bytes)),
  (e) => { if (e.code === 'ENOENT') return DEFAULTS.slice(); throw e; });

const save = async (storage: Storage, items: Item[]) => {
  await storage.fs.atomicWriteFile(FILE, new TextEncoder().encode(JSON.stringify(items)));
  return { ok: true, error: '' };
};

const sources: Sources = {
  loadFoods: (_args, _store, storage) => load(storage),
  addFood: async ([title], _store, storage) => {
    const all = await load(storage);
    const same = all.find((i) => i.title.toLowerCase() === title.toLowerCase());
    if (same) return { ok: false, error: `${same.title} is already on the list.` };
    const id = String(Math.max(0, ...all.map((i) => Number(i.id))) + 1);
    return save(storage, [...all, { id, title }]);
  },
  removeFood: async ([id], _store, storage) =>
    save(storage, (await load(storage)).filter((i) => i.id !== id)),
};
export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
