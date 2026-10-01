const {
  archiveDocument,
  createDocument,
  deleteDocument,
  getDocument,
  listCollection,
  updateDocument,
  validatePayload,
  writeAuditLog,
} = require("../services/firestoreRepository");

function registerAdminResource(router, {
  path,
  collection,
  fields,
  requiredFields = [],
  filterFields = [],
  deleteMode = "archive",
  orderBy = "createdAt",
  operations = {},
}) {
  const {
    getItem = true,
    replace = true,
    patch = true,
    remove = true,
  } = operations;

  router.get(path, async (request, response) => {
    const filters = filterFields
      .filter((field) => typeof request.query[field] === "string" && request.query[field] !== "")
      .map((field) => [field, "==", request.query[field]]);
    const result = await listCollection(collection, { filters, query: request.query, orderBy });
    return response.json(result);
  });

  router.post(path, async (request, response) => {
    const payload = validatePayload(request.body, fields, requiredFields);
    const created = await createDocument(collection, {
      ...payload,
      createdBy: request.user.email,
    });
    await writeAuditLog({
      actorId: request.user.email,
      action: "created",
      entity: collection,
      entityId: created.id,
      requestId: request.requestId,
      after: { id: created.id, status: created.status || null },
    });
    return response.status(201).json({ data: created });
  });

  if (getItem) {
    router.get(`${path}/:id`, async (request, response) => {
      const resource = await getDocument(collection, request.params.id);
      return response.json({ data: resource });
    });
  }

  if (replace) router.put(`${path}/:id`, async (request, response) => {
    const payload = validatePayload(request.body, fields, requiredFields);
    const before = await getDocument(collection, request.params.id);
    const updated = await updateDocument(collection, request.params.id, payload);
    await writeAuditLog({
      actorId: request.user.email,
      action: "replaced",
      entity: collection,
      entityId: updated.id,
      requestId: request.requestId,
      before: { id: before.id, status: before.status || null },
      after: { id: updated.id, status: updated.status || null },
    });
    return response.json({ data: updated });
  });

  if (patch) router.patch(`${path}/:id`, async (request, response) => {
    const payload = validatePayload(request.body, fields);
    if (!Object.keys(payload).length) {
      return response.status(400).json({
        error: { code: "EMPTY_PATCH", message: "At least one supported field is required." },
      });
    }
    const before = await getDocument(collection, request.params.id);
    const updated = await updateDocument(collection, request.params.id, payload);
    await writeAuditLog({
      actorId: request.user.email,
      action: "updated",
      entity: collection,
      entityId: updated.id,
      requestId: request.requestId,
      before: { id: before.id, status: before.status || null },
      after: { id: updated.id, status: updated.status || null },
    });
    return response.json({ data: updated });
  });

  if (remove) router.delete(`${path}/:id`, async (request, response) => {
    const before = await getDocument(collection, request.params.id);
    if (deleteMode === "delete") {
      await deleteDocument(collection, request.params.id);
    } else {
      await archiveDocument(collection, request.params.id);
    }
    await writeAuditLog({
      actorId: request.user.email,
      action: deleteMode === "delete" ? "deleted" : "archived",
      entity: collection,
      entityId: before.id,
      requestId: request.requestId,
      before: { id: before.id, status: before.status || null },
      after: deleteMode === "delete" ? null : { id: before.id, status: "archived" },
    });
    return response.status(204).end();
  });
}

module.exports = { registerAdminResource };
