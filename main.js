'use strict';

const http = require('http');
const mysqlx = require('@mysql/xdevapi');

const port = process.env.PORT || 9999;
const statusOk = 200;
// const statusNoContent = 204;
const statusBadRequest = 400;
const statusNotFound = 404;
const statusInternalServerError = 500;
const schema = 'social';

const client = mysqlx.getClient({
    user: 'app',
    password: 'pass',
    host: '0.0.0.0',
    port: '33060',
});

function sendResponse(resp, {status = statusOk, headers = {}, body = null}) {
    Object.entries(headers).forEach(function([key, value]) {
        resp.setHeader(key, value);
    });
    resp.writeHead(status);
    resp.end(body);
}

function sendJSON(resp, body) {
    sendResponse(resp, {
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
}

function map(columns) {
    return row => row.reduce((res, value, i) => ({...res, [columns[i].getColumnLabel()]: value}), {});
}

const methods = new Map();

methods.set('/posts.get', async ({resp, db}) => {
    const table = await db.getTable('posts');
    const result = await table.select(['id', 'content', 'likes', 'created'])
        .where('removed = 0')
        .orderBy('ID DESC')
        .execute();
  
    const data = result.fetchAll();
    const columns = result.getColumns();
    const posts = data.map(map(columns));
    sendJSON(resp, posts);
});

methods.set('/posts.getById', async ({resp, searchParams, db}) => {
    if (!searchParams.has('id')) {
        sendResponse(resp, {status: statusBadRequest});
        return;
    }
    const id = Number(searchParams.get('id'));
    if (Number.isNaN(id)) {
        sendResponse(resp, {status: statusBadRequest});
        return;
    }
    const table = await db.getTable('posts');
    const result = await table.select(['id', 'content', 'likes', 'created'])
        .where('id = :id AND removed = 0')
        .bind('id', id)
        .execute();

    const data = result.fetchAll();
    const columns = result.getColumns();
    const posts = data.map(map(columns));
    if (posts.length === 0) {
        sendResponse(resp, {status: statusNotFound});
        return;
    }
    sendJSON(resp, posts[0]);
});

methods.set('/posts.post', async ({resp, searchParams, db}) => {
    if (!searchParams.has('content')) {
        sendResponse(resp, {status: statusBadRequest});
        return;
    }
    const content = searchParams.get('content');

    const table = await db.getTable('posts');
    const added = await table.insert('content')
        .values(content)
        .execute();

    const id = added.getAutoIncrementValue();
    const result = await table.select(['id', 'content', 'likes', 'created'])
        .where('id = :id')
        .bind('id', id)
        .execute();

    const data = result.fetchAll();
    const columns = result.getColumns();
    const posts = data.map(map(columns));
    if (posts.length === 0) {
        sendResponse(resp, {status: statusNotFound});
        return;
    }
    sendJSON(resp, posts[0]);
});

methods.set('/posts.edit', async ({resp, searchParams, db}) => {
    if (!searchParams.has('id') || !searchParams.has('content')){
        sendResponse(resp, {status: statusBadRequest});
        return;
    }
    const id = Number(searchParams.get('id'));
    if (Number.isNaN(id)) {
        sendResponse(resp, {status: statusBadRequest});
        return;
    }
    const content = searchParams.get('content');
    
    const table = db.getTable('posts');
    const updated = await table.update()
        .set('content', content)
        .where('id = :id AND removed = 0')
        .bind('id', id)
        .execute();

    const rows = updated.getAffectedItemsCount();
    if (rows === 0) {
        sendResponse(resp, {status: statusNotFound});
        return;
    }

    const result = await table.select(['id', 'content', 'likes', 'created'])
        .where('id = :id')
        .bind('id', id)
        .execute();

    const data = result.fetchAll();
    const columns = result.getColumns();
    const posts = data.map(map(columns));
    if (posts.length === 0) {
        sendResponse(resp, {status: statusNotFound});
        return;
    }
    sendJSON(resp, posts[0]);
});

methods.set('/posts.delete', async ({resp, searchParams, db}) => {
    if (!searchParams.has('id')){
        sendResponse(resp, {status: statusBadRequest});
        return;
    }
    const id = Number(searchParams.get('id'));
    if (Number.isNaN(id)) {
        sendResponse(resp, {status: statusBadRequest});
        return;
    }

    const table = await db.getTable('posts');
    const updated = await table.update()
        .set('removed', true)
        .where('id = :id AND removed = 0')
        .bind('id', id)
        .execute();

    const removed = updated.getAffectedItemsCount();
    if (removed === 0) {
        sendResponse(resp, {status: statusNotFound});
        return;
    }

    const result = await table.select(['id', 'content', 'likes', 'created'])
        .where('id = :id')
        .bind('id', id)
        .execute();
    const data = result.fetchAll();
    const columns = result.getColumns();
    const posts = data.map(map(columns));
    sendJSON(resp, posts[0]);
});

methods.set('/posts.restore', async ({resp, searchParams, db}) => {
    if (!searchParams.has('id')){
        sendResponse(resp, {status: statusBadRequest});
        return;
    }
    const id = Number(searchParams.get('id'));
    if (Number.isNaN(id)) {
        sendResponse(resp, {status: statusBadRequest});
        return;
    }
    
    const table = await db.getTable('posts');
    const updated = await table.update()
        .set('removed', false)
        .where('id = :id AND removed = 1')
        .bind('id', id)
        .execute();

    const removed = updated.getAffectedItemsCount();
    if (removed === 0) {
        sendResponse(resp, {status: statusNotFound});
        return;
    }

    const result = await table.select(['id', 'content', 'likes', 'created'])
        .where('id = :id')
        .bind('id', id)
        .execute();
    const data = result.fetchAll();
    const columns = result.getColumns();
    const posts = data.map(map(columns));
    sendJSON(resp, posts[0]);
});

methods.set('/posts.like', async ({resp, searchParams, db}) => {
    if (!searchParams.has('id')){
        sendResponse(resp, {status: statusBadRequest});
        return;
    }
    const id = Number(searchParams.get('id'));
    if (Number.isNaN(id)) {
        sendResponse(resp, {status: statusBadRequest});
        return;
    }

    const table = db.getTable('posts');
    const result = await table.select(['id', 'content', 'likes', 'created'])
        .where('id = :id AND removed = 0')
        .bind('id', id)
        .execute();
    const data = result.fetchAll();
    const columns = result.getColumns();
    const posts = data.map(map(columns));
    if (posts.length === 0) {
        sendResponse(resp, {status: statusNotFound});
        return;
    }

    const likes = posts[0]['likes'] + 1;
    await table.update().set('likes', likes).where('id = :id').bind('id', id).execute();

    posts[0]['likes'] += 1;
    sendJSON(resp, posts[0]);
});

methods.set('/posts.dislike', async ({resp, searchParams, db}) => {
    if (!searchParams.has('id')){
        sendResponse(resp, {status: statusBadRequest});
        return;
    }
    const id = Number(searchParams.get('id'));
    if (Number.isNaN(id)) {
        sendResponse(resp, {status: statusBadRequest});
        return;
    }

    const table = db.getTable('posts');
    const result = await table.select(['id', 'content', 'likes', 'created'])
        .where('id = :id AND removed = 0')
        .bind('id', id)
        .execute();
    const data = result.fetchAll();
    const columns = result.getColumns();
    const posts = data.map(map(columns));
    if (posts.length === 0) {
        sendResponse(resp, {status: statusNotFound});
        return;
    }

    const likes = posts[0]['likes'] - 1;
    await table.update().set('likes', likes).where('id = :id').bind('id', id).execute();
    
    posts[0]['likes'] -= 1;
    sendJSON(resp, posts[0]);
});

const server = http.createServer(async (req, resp) => {
    const {pathname, searchParams} = new URL(req.url, `http://${req.headers.host}`);

    const method = methods.get(pathname);
    if (method === undefined) {
        sendResponse(resp, {status: statusNotFound});
        return;
    }

    let session = null;
    try {
        session = await client.getSession();
        const db = await session.getSchema(schema);

        const params = {
            req,
            resp,
            pathname,
            searchParams,
            db,
        };
        await method(params);
    } catch (error) {
        sendResponse(resp, {status: statusInternalServerError});
    } finally {
        if (session !== null) {
            try {
                await session.close();
            } catch (error) {
                console.log(error);
            }
        }
    }
});

server.listen(port);