const {sortObjectKeys} = require('./serialization-helper')

function areMapsEqual(map, otherMap) {
    if (map.size !== otherMap.size) {
        return false
    }

    for (const [key, value] of map) {
        if (!otherMap.has(key)) {
            return false
        }

        if (!value.equals(otherMap.get(key))) {
            return false
        }
    }

    return true
}

function mapToPlainObject(map) {
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