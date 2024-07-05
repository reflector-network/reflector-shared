const {sortObjectKeys} = require('./serialization-helper')

function areMapsEqual(map, otherMap) {
    if (map.size !== otherMap.size) {
        return false
    }

    for (const [key, value] of map) {
        if (!otherMap.has(key)) {
            return false
        }

        return value.equals ? value.equals(otherMap.get(key)) : value === otherMap.get(key)
    }

    return true
}

function mapToPlainObject(map) {
    if (!map)
        return
    if (!(map instanceof Map))
        throw new Error('map is not instance of Map')
    const plainObj = {}
    for (const [key, value] of map) {
        if (value && typeof value.toPlainObject === 'function') {
            plainObj[key] = value.toPlainObject()
        } else {
            plainObj[key] = value
        }
    }
    return sortObjectKeys(plainObj)
}

module.exports = {
    areMapsEqual,
    mapToPlainObject
}