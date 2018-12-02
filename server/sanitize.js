var sanitize = function(str) {
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/\"/g, "&quot;");
    str = str.replace(/\'/g, "&#039;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");
    return str;
}

module.exports = sanitize;
