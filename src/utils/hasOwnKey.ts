export function hasOwnKey<O>(obj: O, key: string | number | symbol): key is keyof O
{
    return Object.prototype.hasOwnProperty.call(obj, key);
}
