module.exports = class IssuesContainer {
    static notDefined = 'Not defined'
    static invalidOrNotDefined = 'Invalid or not defined'

    __issues = []

    __addIssue(issue) {
        this.__issues.push(issue)
        return null
    }

    get issues() {
        if (this.isValid)
            return undefined
        return this.__issues
    }

    get issuesString() {
        return this.__issues.join('\n')
    }

    get isValid() {
        return this.__issues.length === 0
    }
}