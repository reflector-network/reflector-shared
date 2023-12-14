function sortObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys)
    }
    return Object.keys(obj).sort().reduce((sortedObj, key) => {
        sortedObj[key] = sortObjectKeys(obj[key])
        return sortedObj
    }, {})
}

module.exports = {sortObjectKeys}