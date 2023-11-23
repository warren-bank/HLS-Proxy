const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const ivLength = 16;
const tagLength = 16;
const defaultEncoding = 'hex';
const defaultSaltLength = 64;
const defaultPbkdf2Iterations = 100000;

function Cryptr(secret, options) {
    if (!secret || typeof secret !== 'string') {
        throw new Error('Cryptr: secret must be a non-0-length string');
    }

    let encoding = defaultEncoding;
    let saltLength = defaultSaltLength;
    let pbkdf2Iterations = defaultPbkdf2Iterations;

    if (options) {
        if (options.encoding) {
            encoding = options.encoding;
        }

        if (options.pbkdf2Iterations) {
            pbkdf2Iterations = options.pbkdf2Iterations;
        }

        if (options.saltLength) {
            saltLength = options.saltLength;
        }
    }

    const tagPosition = saltLength + ivLength;
    const encryptedPosition = tagPosition + tagLength;

    function getKey(salt) {
        return crypto.pbkdf2Sync(secret, salt, pbkdf2Iterations, 32, 'sha512');
    }

    this.encrypt = function encrypt(value) {
        if (value == null) {
            throw new Error('value must not be null or undefined');
        }

        const iv = crypto.randomBytes(ivLength);
        const salt = crypto.randomBytes(saltLength);

        const key = getKey(salt);

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);

        const tag = cipher.getAuthTag();

        return Buffer.concat([salt, iv, tag, encrypted]).toString(encoding);
    };

    this.decrypt = function decrypt(value) {
        if (value == null) {
            throw new Error('value must not be null or undefined');
        }

        const stringValue = Buffer.from(String(value), encoding);

        const salt = stringValue.subarray(0, saltLength);
        const iv = stringValue.subarray(saltLength, tagPosition);
        const tag = stringValue.subarray(tagPosition, encryptedPosition);
        const encrypted = stringValue.subarray(encryptedPosition);

        const key = getKey(salt);

        const decipher = crypto.createDecipheriv(algorithm, key, iv);

        decipher.setAuthTag(tag);

        return decipher.update(encrypted) + decipher.final('utf8');
    };
}

module.exports = Cryptr;
