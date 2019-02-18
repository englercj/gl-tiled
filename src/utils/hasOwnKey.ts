export function hasOwnKey<O>(obj: O, key: string | number | symbol): key is keyof O
{
    return obj.hasOwnProperty(key);
}
