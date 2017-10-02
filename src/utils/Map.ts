export default class Map<TKey, TValue>
{
    private _keys: TKey[] = [];
    private _values: TValue[] = [];

    get(key: TKey)
    {
        for (let i = 0; i < this._keys.length; ++i)
        {
            if (this._keys[i] == key)
            {
                return this._values[i];
            }
        }
    }

    set(key: TKey, value: TValue)
    {
        for (let i = 0; i < this._keys.length; ++i)
        {
            if (this._keys[i] == key)
            {
                this._values[i] = value;

                return this;
            }
        }

        this._keys.push(key);
        this._values.push(value);

        return this;
    }

    delete(key: TKey)
    {
        for (let i = 0; i < this._keys.length; ++i)
        {
            if (this._keys[i] == key)
            {
                this._keys.splice(i, 1);
                this._values.splice(i, 1);

                return true;
            }
        }

        return false;
    }

    has(key: TKey)
    {
        for (let i = 0; i < this._keys.length; ++i)
        {
            if (this._keys[i] == key)
            {
                return true
            }
        }

        return false;
    }
}