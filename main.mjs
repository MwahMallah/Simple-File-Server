import {createServer} from "node:http";

const methods = Object.create(null);

createServer((req, res) => {
    let handler = methods[req.method] || notAllowed;
    handler(req)
    .catch(err => {
        if (err.status != null)
            return err;
        return {
            status: 500,
            body: String(err)
        };
    })
    .then(({body, status=200, type="text/plain"}) => {
        res.writeHead(status, {"Content-Type": type});
        if (body?.pipe)
            body.pipe(res);
        else
            res.end(body);
    });

}).listen(8000);

console.log("Listening on 8000!");

async function notAllowed(req) {
    return {
        status: 405,
        body: `Method ${req.method} is not allowed`
    };
}

import {resolve, sep} from "node:path";

const baseDirectory = process.cwd();

function urlPath(url) {
    let {pathname} = new URL(url, "http://d");
    let path = resolve(decodeURIComponent(pathname).slice(1));
    if (path != baseDirectory &&
        !path.startsWith(baseDirectory + sep)) {
        throw {status: 403, body: "Forbidden"};
    }
    return path;
}

import { stat, readdir } from "node:fs/promises";
import { createReadStream} from "node:fs";
import { lookup } from "mime-types";

methods.GET = async function(req) {
    let path = urlPath(req.url);
    let stats;
    try {
        stats = await stat(path);
    } catch(err) {
        if (err.code != "ENOENT")
            throw err;
        else 
            return {status: 404, body: "File not found"};
    }

    if (stats.isDirectory()) 
        return {body: (await readdir(path)).join("\n")}
    else 
        return {body: createReadStream(path),
                type: lookup(path)};
}

import { rmdir, unlink } from "node:fs/promises";

methods.DELETE = async function(req) {
    let path = urlPath(req.url);
    let stats;
    try {
        stats = await stat(path);
    } catch (err) {
        if (err.code != "ENOENT")
            throw err;
        else 
            return {status: 204};
    }

    if (stats.isDirectory())
        await rmdir(path);
    else 
        await unlink(path);

    return {status: 204};
}

import { createWriteStream } from "node:fs";

function pipeStream(from, to) {
    return new Promise((resolve, reject) => {
        from.on("error", reject);
        to.on("error", reject);
        to.on("finish", resolve);
        from.pipe(to);
    });
}

methods.PUT = async function(req) {
    let path = urlPath(req.url);
    await pipeStream(req, createWriteStream(path));
    return {status: 204};
}

import { mkdir } from "node:fs/promises";

methods.MKCOL = async function(req) {
    let path = urlPath(req.url);
    let stats;
    try {
        stats = await stat(path);
        if (stats.isDirectory()) {
            return {status: 204};
        } else {
            return {status: 400};
        }
    } catch {
        await mkdir(path);
        return {status: 204} 
    }
}