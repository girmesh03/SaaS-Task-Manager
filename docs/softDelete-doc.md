# Soft Delete Plugin - Document

Note:
    - All error codes post fix with _ERROR
    - Except organization and vendor, the scope is req.user.organization._id and req.user.department._id

---

## Policy Rules

---

```json
{
  "meta": {
    "policyName": "Cascade Lifecycle Management (Soft Delete + Strict Restore Mode)",
    "version": "1.0.0"
  },
  "global": {
    "softDeleteOnly": true,
    "strictRestoreMode": true,
    "parentIntegrityConstraint": {
      "rule": "A resource cannot be restored if any direct or indirect parent is soft-deleted (isDeleted === true).",
      "scope": "organization, department, parent task/activity/comment, and any structural parent in the ownership graph",
      "errorCode": "RESTORE_BLOCKED_PARENT_DELETED"
    },
    "criticalDependencyConstraint": {
      "rule": "On restore, resources must validate listed critical dependencies; if any are soft-deleted or missing, restoration is blocked unless an entity-specific repair policy is defined.",
      "errorCode": "RESTORE_BLOCKED_DEPENDENCY_DELETED",
      "note": "Weak references (watchers, mentions) never block restoration."
    },
    "defaultQueryBehavior": {
      "excludeSoftDeletedByDefault": true,
      "helpers": {
        "withDeleted": "Include both deleted and non-deleted",
        "onlyDeleted": "Return only deleted"
      },
      "pluginHooks": [
        "pre:find",
        "pre:findOne",
        "pre:findOneAndUpdate",
        "pre:countDocuments",
        "pre:count"
      ]
    },
    "hardDeleteProtection": {
      "blockedMethods": [
        "deleteOne",
        "deleteMany",
        "findOneAndDelete",
        "remove"
      ],
      "error": "Hard delete is not allowed. Use softDelete() or softDeleteById() instead."
    },
    "ttl": {
      "enabled": "optional",
      "field": "deletedAt",
      "partialFilterExpression": {
        "isDeleted": true
      },
      "indexCreator": "ensureTTLIndex(expireAfterSeconds)",
      "risk": "TTL causes irreversible hard deletion",
      "policy": "Enable TTL only after full cascade has completed, and never where later restoration is required."
    },
    "multiTenant": {
      "tenantRoot": "Organization",
      "enforceOrgBoundary": true,
      "requireOrgConsistencyOnAllRefs": true,
      "errorCode": "CROSS_ORG_VIOLATION",
      "queryScope": "All cascade queries MUST filter by organizationId"
    },
    "effectiveDeletionDefinition": "self.isDeleted === true OR any ancestor.isDeleted === true",
    "auditIntegrity": {
      "fields": [
        "isDeleted",
        "deletedAt",
        "deletedBy",
        "restoredAt",
        "restoredBy"
      ],
      "idempotency": {
        "softDelete": {
          "preserveOriginalDeletedByAndDeletedAt": true,
          "policy": "If already isDeleted === true, skip calling .softDelete() to avoid overwriting original audit."
        },
        "restore": {
          "note": "Plugin sets restoredAt/restoredBy and clears deletedBy/deletedAt; external audit logs should preserve historical deletions."
        }
      }
    }
  },
  "fieldConstraints": {
    "BaseTask.attachments.maxItems": 10,
    "BaseTask.watchers.maxItems": 20,
    "TaskComment.mentions.maxItems": 5,
    "RoutineTask.materials.maxItems": 20,
    "RoutineTask.materials.quantity.min": 0,
    "TaskActivity.materials.maxItems": 20,
    "TaskActivity.materials.quantity.min": 0
  },
  "graph": {
    "ownershipEdges": [
      {
        "parent": "Organization",
        "child": "Department",
        "via": "Department.organization"
      },
      {
        "parent": "Organization",
        "child": "Vendor",
        "via": "Vendor.organization"
      },
      {
        "parent": "Organization",
        "child": "Notification",
        "via": "Notification.organization"
      },
      {
        "parent": "Organization",
        "child": "User",
        "via": "User.organization"
      },
      {
        "parent": "Organization",
        "child": "BaseTask (ProjectTask|RoutineTask|AssignedTask)",
        "via": "BaseTask.organization"
      },
      {
        "parent": "Organization",
        "child": "TaskActivity",
        "via": "TaskActivity.organization"
      },
      {
        "parent": "Organization",
        "child": "TaskComment",
        "via": "TaskComment.organization"
      },
      {
        "parent": "Organization",
        "child": "Attachment",
        "via": "Attachment.organization"
      },
      {
        "parent": "Organization",
        "child": "Material",
        "via": "Material.organization"
      },
      {
        "parent": "Department",
        "child": "User",
        "via": "User.department"
      },
      {
        "parent": "Department",
        "child": "BaseTask (ProjectTask|RoutineTask|AssignedTask)",
        "via": "BaseTask.department"
      },
      {
        "parent": "Department",
        "child": "Material",
        "via": "Material.department"
      },
      {
        "parent": "BaseTask (ProjectTask|RoutineTask|AssignedTask|RoutineTask)",
        "child": "TaskActivity",
        "via": "TaskActivity.parent (ProjectTask|AssignedTask ONLY)"
      },
      {
        "parent": "BaseTask (ProjectTask|RoutineTask|AssignedTask)",
        "child": "TaskComment",
        "via": "TaskComment.parent (Task)"
      },
      {
        "parent": "BaseTask (ProjectTask|RoutineTask|AssignedTask)",
        "child": "Attachment",
        "via": "Attachment.parent (Task)"
      },
      {
        "parent": "TaskActivity",
        "child": "TaskComment",
        "via": "TaskComment.parent (TaskActivity)"
      },
      {
        "parent": "TaskActivity",
        "child": "Attachment",
        "via": "Attachment.parent (TaskActivity)"
      },
      {
        "parent": "TaskComment",
        "child": "TaskComment",
        "via": "TaskComment.parent (TaskComment)"
      },
      {
        "parent": "TaskComment",
        "child": "Attachment",
        "via": "Attachment.parent (TaskComment)"
      }
    ],
    "weakRefs": [
      "BaseTask.watchers[] -> User",
      "AssignedTask.assignees (User | User[])",
      "TaskComment.mentions[] -> User"
    ],
    "criticalDependencies": [
      "BaseTask.createdBy -> User (must exist and be active for restore)",
      "ProjectTask.vendor -> Vendor (must exist and be active for restore)",
      "RoutineTask.materials[].material -> Material (must exist and be active for restore)",
      "TaskActivity.materials[].material -> Material (must exist and be active for restore)",
      "TaskActivity.parent -> (ProjectTask|AssignedTask) active (parent rule)",
      "TaskComment.parent -> (Task|TaskActivity|TaskComment) active chain (parent rule)",
      "Attachment.parent -> (Task|TaskActivity|TaskComment) active chain (parent rule)"
    ],
    "nonBlockingDependencies": [
      "Department.hod -> User (nullable; if invalid, auto-null on restore)",
      "Attachment.uploadedBy -> User (audit; does not block)",
      "Vendor.createdBy -> User (audit; does not block)",
      "Material.addedBy -> User (audit; does not block)",
      "TaskComment.mentions[] -> User (weak; prune invalid on restore)",
      "BaseTask.watchers[] -> User (weak; prune invalid on restore)",
      "AssignedTask.assignees[] -> User (weak, but see rule requiring at least one active assignee)"
    ]
  },
  "entities": {
    "Organization": {
      "parents": [],
      "parentFields": [],
      "ownedChildren": [
        "Department",
        "Vendor",
        "Notification",
        "User",
        "ProjectTask",
        "RoutineTask",
        "AssignedTask",
        "TaskActivity",
        "TaskComment",
        "Attachment",
        "Material"
      ],
      "weakRefs": [],
      "criticalDependencies": [],
      "restorePrerequisites": [],
      "deletionCascadePolicy": {
        "idempotent": true,
        "scope": "All documents with organization == this._id across all models",
        "order": [
          "Organization",
          "Department",
          "User",
          "ProjectTask",
          "RoutineTask",
          "AssignedTask",
          "TaskActivity",
          "TaskComment",
          "Attachment",
          "Material",
          "Vendor",
          "Notification"
        ]
      },
      "restorePolicy": {
        "strictParentCheck": true,
        "topDown": true,
        "childrenNotAutoRestored": true
      }
    },
    "Department": {
      "parents": ["Organization"],
      "parentFields": ["Department.organization"],
      "ownedChildren": [
        "User",
        "ProjectTask",
        "RoutineTask",
        "AssignedTask",
        "Material"
      ],
      "weakRefs": [],
      "criticalDependencies": [],
      "nonBlockingDependencies": ["Department.hod (nullable User)"],
      "restorePrerequisites": ["organization.isDeleted === false"],
      "repairOnRestore": [
        "If hod is missing/soft-deleted/cross-org, set hod = null and emit DEPT_HOD_PRUNED"
      ]
    },
    "User": {
      "parents": ["Organization", "Department"],
      "parentFields": ["User.organization", "User.department"],
      "ownedChildren": [],
      "weakRefs": [],
      "criticalDependencies": [],
      "restorePrerequisites": [
        "organization.isDeleted === false",
        "department.isDeleted === false"
      ]
    },
    "BaseTask": {
      "abstract": true,
      "parents": ["Organization", "Department"],
      "parentFields": ["BaseTask.organization", "BaseTask.department"],
      "ownedChildren": ["TaskActivity", "TaskComment", "Attachment"],
      "weakRefs": ["watchers[] -> User"],
      "criticalDependencies": ["createdBy -> User active"],
      "restorePrerequisites": [
        "organization.isDeleted === false",
        "department.isDeleted === false",
        "createdBy.isDeleted === false"
      ],
      "repairOnRestore": [
        "Prune watchers[] that are missing, cross-org, or soft-deleted (emit TASK_WATCHER_PRUNED)"
      ],
      "fieldConstraints": {
        "attachments.maxItems": 10,
        "watchers.maxItems": 20
      }
    },
    "ProjectTask": {
      "extends": "BaseTask",
      "criticalDependencies": ["vendor -> Vendor active"],
      "restorePrerequisites": ["vendor.isDeleted === false"]
    },
    "RoutineTask": {
      "extends": "BaseTask",
      "criticalDependencies": [
        "materials[].material -> Material active",
        "materials[].quantity >= 0"
      ],
      "restorePrerequisites": [
        "All materials[].material exist and isDeleted === false",
        "All materials[].quantity >= 0"
      ],
      "fieldConstraints": {
        "materials.maxItems": 20
      }
    },
    "AssignedTask": {
      "extends": "BaseTask",
      "weakRefs": ["assignees (User | User[])"],
      "restorePrerequisites": [
        "At least one active assignee after pruning soft-deleted or cross-org users"
      ],
      "repairOnRestore": [
        "Normalize assignees to array",
        "Prune invalid assignees; if none remain, block with ASSIGNED_TASK_NO_ACTIVE_ASSIGNEES"
      ]
    },
    "TaskActivity": {
      "parents": ["ProjectTask|AssignedTask", "Department", "Organization"],
      "parentFields": [
        "TaskActivity.parent",
        "TaskActivity.department",
        "TaskActivity.organization"
      ],
      "ownedChildren": ["TaskComment", "Attachment"],
      "weakRefs": [],
      "criticalDependencies": [
        "parent (ProjectTask|AssignedTask) active",
        "createdBy -> User active",
        "materials[].material -> Material active"
      ],
      "restorePrerequisites": [
        "organization.isDeleted === false",
        "department.isDeleted === false",
        "parent.isDeleted === false",
        "createdBy.isDeleted === false",
        "All materials[].material isDeleted === false"
      ],
      "fieldConstraints": {
        "materials.maxItems": 20,
        "materials.quantity.min": 0
      }
    },
    "TaskComment": {
      "parents": [
        "Task|TaskActivity|TaskComment",
        "Department",
        "Organization"
      ],
      "parentFields": [
        "TaskComment.parent",
        "TaskComment.department",
        "TaskComment.organization"
      ],
      "ownedChildren": ["TaskComment (replies)", "Attachment"],
      "weakRefs": ["mentions[] -> User"],
      "criticalDependencies": [
        "Parent chain to root (Task or TaskActivity) must be active and acyclic",
        "createdBy -> User active"
      ],
      "restorePrerequisites": [
        "organization.isDeleted === false",
        "department.isDeleted === false",
        "All ancestors in parent chain isDeleted === false",
        "createdBy.isDeleted === false"
      ],
      "repairOnRestore": [
        "Prune mentions[] that are missing, cross-org, or soft-deleted (emit COMMENT_MENTION_PRUNED)"
      ],
      "fieldConstraints": {
        "mentions.maxItems": 5
      }
    },
    "Attachment": {
      "parents": [
        "Task|TaskActivity|TaskComment",
        "Department",
        "Organization"
      ],
      "parentFields": [
        "Attachment.parent",
        "Attachment.department",
        "Attachment.organization"
      ],
      "ownedChildren": [],
      "weakRefs": ["uploadedBy -> User (audit)"],
      "criticalDependencies": [
        "Parent chain active and consistent (org/department alignment with parent)"
      ],
      "restorePrerequisites": [
        "organization.isDeleted === false",
        "department.isDeleted === false",
        "Parent chain active (no soft-deleted parent or ancestor)"
      ],
      "repairOnRestore": [
        "If org/department mismatch with parent, hard-fix by aligning to parent's org/department and emit ATTACHMENT_SCOPE_FIXED"
      ]
    },
    "Material": {
      "parents": ["Department", "Organization"],
      "parentFields": ["Material.department", "Material.organization"],
      "ownedChildren": [],
      "weakRefs": ["addedBy -> User (audit)"],
      "criticalDependencies": [],
      "restorePrerequisites": [
        "organization.isDeleted === false",
        "department.isDeleted === false"
      ]
    },
    "Vendor": {
      "parents": ["Organization"],
      "parentFields": ["Vendor.organization"],
      "ownedChildren": [],
      "weakRefs": ["createdBy -> User (audit)"],
      "criticalDependencies": [],
      "restorePrerequisites": ["organization.isDeleted === false"]
    },
    "Notification": {
      "parents": ["Organization"],
      "parentFields": ["Notification.organization"],
      "ownedChildren": [],
      "weakRefs": ["recipient -> User", "entity -> Any resource"],
      "restorePolicy": {
        "notRestoredByDefault": true,
        "note": "Notifications represent ephemeral history and are deleted with their tenant; do not restore."
      }
    }
  },
  "orders": {
    "deletion": [
      "Organization",
      "Department",
      "User",
      "ProjectTask",
      "RoutineTask",
      "AssignedTask",
      "TaskActivity",
      "TaskComment",
      "Attachment",
      "Material",
      "Vendor",
      "Notification"
    ],
    "restoration": [
      "Organization",
      "Department",
      "User",
      "ProjectTask",
      "RoutineTask",
      "AssignedTask",
      "TaskActivity",
      "TaskComment",
      "Attachment",
      "Material",
      "Vendor"
    ],
    "notes": [
      "Deletion may mark parent first; all descendants must also be soft-deleted to preserve plugin-level filtering guarantees.",
      "Restoration is top-down only; children are NOT auto-restored unless explicitly orchestrated by the service."
    ]
  },
  "validations": {
    "globalPreDelete": [
      "Enforce organization boundary for the actor and target.",
      "Idempotent: If doc.isDeleted === true, do not overwrite deletedBy/deletedAt.",
      "Use withDeleted() to enumerate children so already-deleted nodes are included and can be skipped safely.",
      "Use sessions/transactions or resumable jobs for long cascades."
    ],
    "globalPreRestore": [
      "Use withDeleted() to fetch the target and its parents.",
      "Parent Integrity Constraint: All parents must be active (not soft-deleted).",
      "Critical dependency validation per-entity.",
      "Organization boundary on all references and parents.",
      "Re-validate immediately before .restore() (optimistic locking) and within the same transaction."
    ],
    "perEntityHighlights": {
      "AssignedTask": [
        "Normalize assignees to array.",
        "Prune cross-org or deleted users.",
        "Block if no active assignees remain."
      ],
      "TaskComment": [
        "Detect and block cycles in parent chain.",
        "Prune mentions referencing deleted or cross-org users."
      ],
      "Attachment": ["Align org/department with active parent if mismatched."],
      "BaseTaskFamily": [
        "Ensure createdBy is active; block otherwise.",
        "ProjectTask: vendor active.",
        "RoutineTask & TaskActivity: all material references active and quantities valid (>= 0)."
      ],
      "Department": ["If HOD invalid, set to null and continue."]
    }
  },
  "edgeCases": {
    "deletionOrder": [
      {
        "id": "EC_DEL_1",
        "name": "Child already deleted",
        "risk": "Audit overwrite",
        "rule": "Deletion is idempotent; do not overwrite deletedBy/deletedAt",
        "handling": "Skip calling .softDelete() for already-deleted docs; still traverse the subtree"
      },
      {
        "id": "EC_DEL_2",
        "name": "Partial cascade failure",
        "risk": "Half-deleted tenant",
        "handling": "Use MongoDB transactions or resumable background job with progress checkpoints and retries"
      },
      {
        "id": "EC_DEL_3",
        "name": "User who deleted a resource is later deleted",
        "risk": "Dangling deletedBy",
        "handling": "Do not null-out audit; preserve deletedBy (audit truth over referential purity)"
      },
      {
        "id": "EC_DEL_4",
        "name": "Cross-organization reference",
        "risk": "Data leak",
        "handling": "Validate org on all refs and parents; block with CROSS_ORG_VIOLATION"
      },
      {
        "id": "EC_DEL_5",
        "name": "Weak references (watchers, assignees, mentions)",
        "risk": "Accidental cascade",
        "handling": "Never cascade via weak refs; ignore during deletion"
      },
      {
        "id": "EC_DEL_6",
        "name": "TTL auto-cleanup races",
        "risk": "Unexpected hard-delete",
        "handling": "Enable TTL only after full cascade and for resources safe to lose"
      }
    ],
    "deletionAdditional": [
      {
        "id": "EC_DEL_A1",
        "name": "Department deleted with tasks still pointing to it",
        "handling": "Tasks are owned by Department and must be soft-deleted in the cascade"
      },
      {
        "id": "EC_DEL_A2",
        "name": "HOD deleted before Department",
        "handling": "HOD is nullable; no additional cascade"
      },
      {
        "id": "EC_DEL_A3",
        "name": "Notifications referencing deleted entities",
        "handling": "Always soft-delete notifications with their tenant; do not restore"
      }
    ],
    "restorationOrder": [
      {
        "id": "EC_RES_1",
        "name": "Restore child while parent is deleted",
        "result": "Blocked",
        "reason": "Parent Integrity Constraint",
        "errorCode": "RESTORE_BLOCKED_PARENT_DELETED"
      },
      {
        "id": "EC_RES_2",
        "name": "Parent soft-deleted between validation and restore",
        "handling": "Re-validate immediately before .restore() within a transaction; abort and retry",
        "technique": "Optimistic locking or pre-commit re-check"
      }
    ],
    "restorationAdditional": [
      {
        "id": "EC_RES_A1",
        "name": "Selective restore after tenant restore",
        "policy": "Allowed; children stay deleted until explicitly restored"
      },
      {
        "id": "EC_RES_A2",
        "name": "Schema evolution during deletion window",
        "handling": "Migration-on-restore and lazy defaults to satisfy new required fields"
      },
      {
        "id": "EC_RES_A3",
        "name": "RestoredBy user is deleted",
        "handling": "Allowed; audit truth preserved"
      },
      {
        "id": "EC_RES_A4",
        "name": "Restore after TTL hard delete",
        "result": "Impossible",
        "policy": "TTL hard deletes are irreversible"
      },
      {
        "id": "EC_RES_A5",
        "name": "AssignedTask with all assignees deleted",
        "handling": "Block with ASSIGNED_TASK_NO_ACTIVE_ASSIGNEES"
      },
      {
        "id": "EC_RES_A6",
        "name": "TaskComment cycles or invalid parent chain",
        "handling": "Block with COMMENT_PARENT_CHAIN_INVALID"
      }
    ]
  },
  "errorCodes": {
    "RESTORE_BLOCKED_PARENT_DELETED": "Cannot restore because a parent is soft-deleted.",
    "RESTORE_BLOCKED_DEPENDENCY_DELETED": "Cannot restore because a critical dependency is soft-deleted.",
    "ASSIGNED_TASK_NO_ACTIVE_ASSIGNEES": "AssignedTask restore blocked; no active assignees remain.",
    "COMMENT_PARENT_CHAIN_INVALID": "TaskComment restore blocked due to invalid or cyclic parent chain.",
    "CROSS_ORG_VIOLATION": "Cross-organization reference detected.",
    "QUOTA_VIOLATION": "Array field exceeds declared maximum.",
    "INVALID_QUANTITY": "Material quantity must be >= 0."
  },
  "algorithms": {
    "deletion": "Guarded, idempotent cascade using transactions or resumable jobs; traverse ownership graph by organization and department scopes.",
    "restoration": "Top-down orchestration under Strict Restore Mode with parent and critical dependency validation; no auto-restore of children unless explicitly requested."
  }
}
```

---

## Restore / Delete Guard Pseudocode

---

```pseudo
// Common helpers

function ensureOrgBoundary(doc, actorOrgId):
    if doc.organization != actorOrgId:
        throw Error(CROSS_ORG_VIOLATION)

function fetchWithDeleted(model, filter, session):
    // wrapper over Mongoose query withDeleted() and session
    return model.find(filter).withDeleted().session(session)

function isDeleted(doc):
    return doc.isDeleted === true

function idempotentSoftDelete(doc, actorId, session):
    if isDeleted(doc):
        // Preserve original deletedBy/deletedAt by not calling plugin method
        return doc
    else:
        return doc.softDelete(actorId, { session })

function strictParentCheck(doc, session):
    // Walk structural parents based on model type
    parents = []
    switch doc.modelName:
        case "Organization":
            parents = []
        case "Department":
            parents = [doc.organization]
        case "User":
            parents = [doc.organization, doc.department]
        case "ProjectTask" | "RoutineTask" | "AssignedTask":
            parents = [doc.organization, doc.department]
        case "TaskActivity":
            parents = [doc.organization, doc.department, doc.parent] // parent Task only ProjectTask|AssignedTask
        case "TaskComment":
            // climb full chain to root Task or TaskActivity
            p = doc.parent
            while p != null:
                parents.push(p)
                if p is TaskActivity:
                    p = p.parent // parent is Task
                else if p is TaskComment:
                    p = p.parent
                else if p is Task (ProjectTask|RoutineTask|AssignedTask):
                    p = null
                else:
                    throw Error(COMMENT_PARENT_CHAIN_INVALID)
        case "Attachment":
            // climb full chain like TaskComment until reaching Task or TaskActivity
            p = doc.parent
            while p != null:
                parents.push(p)
                if p is TaskActivity:
                    p = p.parent
                else if p is TaskComment:
                    p = p.parent
                else if p is Task (ProjectTask|RoutineTask|AssignedTask):
                    p = null
                else:
                    throw Error(ATTACHMENT_PARENT_CHAIN_INVALID)
        case "Material":
            parents = [doc.organization, doc.department]
        case "Vendor":
            parents = [doc.organization]
        default:
            parents = []

    // Resolve references and verify non-deleted
    for each parentRef in parents:
        parentDoc = resolveRefWithDeleted(parentRef, session)
        if parentDoc == null:
            // treat as deleted/missing parent for strictness
            throw Error(RESTORE_BLOCKED_PARENT_DELETED)
        if isDeleted(parentDoc):
            throw Error(RESTORE_BLOCKED_PARENT_DELETED)

    return true

function validateCriticalDependencies(doc, session):
    switch doc.modelName:
        case "ProjectTask" | "RoutineTask" | "AssignedTask" | "BaseTask":
            // createdBy required active
            u = resolveRefWithDeleted(doc.createdBy, session)
            if u == null or isDeleted(u):
                throw Error(RESTORE_BLOCKED_DEPENDENCY_DELETED)

        case "ProjectTask":
            v = resolveRefWithDeleted(doc.vendor, session)
            if v == null or isDeleted(v):
                throw Error(RESTORE_BLOCKED_DEPENDENCY_DELETED)

        case "RoutineTask":
            for each m in doc.materials:
                mat = resolveRefWithDeleted(m.material, session)
                if mat == null or isDeleted(mat):
                    throw Error(RESTORE_BLOCKED_DEPENDENCY_DELETED)
                if m.quantity < 0:
                    throw Error(INVALID_QUANTITY)

        case "AssignedTask":
            // normalize to array
            assignees = toArray(doc.assignees)
            // prune deleted or cross-org
            assignees = filterActiveSameOrg(assignees, doc.organization, session)
            if length(assignees) == 0:
                throw Error(ASSIGNED_TASK_NO_ACTIVE_ASSIGNEES)

        case "TaskActivity":
            u = resolveRefWithDeleted(doc.createdBy, session)
            if u == null or isDeleted(u):
                throw Error(RESTORE_BLOCKED_DEPENDENCY_DELETED)
            for each m in doc.materials:
                mat = resolveRefWithDeleted(m.material, session)
                if mat == null or isDeleted(mat):
                    throw Error(RESTORE_BLOCKED_DEPENDENCY_DELETED)
                if m.quantity < 0:
                    throw Error(INVALID_QUANTITY)

        case "TaskComment":
            u = resolveRefWithDeleted(doc.createdBy, session)
            if u == null or isDeleted(u):
                throw Error(RESTORE_BLOCKED_DEPENDENCY_DELETED)
            // mentions are weak refs; prune later

        case "Attachment":
            // parent chain checked in strictParentCheck
            // uploadedBy is audit; no block

        case "Department":
            // HOD nullable - repair
            if doc.hod != null:
                hod = resolveRefWithDeleted(doc.hod, session)
                if hod == null or isDeleted(hod) or hod.organization != doc.organization:
                    // will repair (set null) not block
                    pass

        default:
            // Organization, Material, Vendor: no additional critical deps
            pass

    return true

function repairNonBlockingOnRestore(doc, session):
    switch doc.modelName:
        case "Department":
            if doc.hod != null:
                hod = resolveRefWithDeleted(doc.hod, session)
                if hod == null or isDeleted(hod) or hod.organization != doc.organization:
                    doc.hod = null
                    emitEvent("DEPT_HOD_PRUNED", { departmentId: doc._id })

        case "BaseTask" | "ProjectTask" | "RoutineTask" | "AssignedTask":
            watchers = toArray(doc.watchers)
            pruned = pruneDeletedOrCrossOrgUsers(watchers, doc.organization, session)
            if length(pruned) != length(watchers):
                doc.watchers = pruned.slice(0, 20) // enforce max
                emitEvent("TASK_WATCHER_PRUNED", { taskId: doc._id })

            if doc.modelName == "AssignedTask":
                // already validated at least one remains active

        case "TaskComment":
            mentions = toArray(doc.mentions)
            pruned = pruneDeletedOrCrossOrgUsers(mentions, doc.organization, session)
            if length(pruned) != length(mentions):
                doc.mentions = pruned.slice(0, 5)
                emitEvent("COMMENT_MENTION_PRUNED", { commentId: doc._id })

        case "Attachment":
            // align org/department with active parent
            parent = resolveParentChainRoot(doc, session) // returns the immediate parent and validates chain
            if parent != null and (doc.organization != parent.organization or doc.department != parent.department):
                doc.organization = parent.organization
                doc.department = parent.department
                emitEvent("ATTACHMENT_SCOPE_FIXED", { attachmentId: doc._id })

        default:
            pass

    return doc

// Deletion: guarded cascade

function cascadeSoftDelete(modelName, id, actorId, session):
    beginTransaction(session)
    try:
        doc = fetchWithDeleted(Model(modelName), { _id: id }, session).findOne()
        if doc == null:
            commit(session); return null

        ensureOrgBoundary(doc, actorOrgIdOf(actorId))

        // Mark parent first (soft delete is reversible and effective-deletion hides children with proper queries)
        idempotentSoftDelete(doc, actorId, session)

        // Enumerate owned children across ownership graph; always use withDeleted()
        children = listOwnedChildrenFor(doc, session) // returns array of { modelName, _id }
        for each child in children:
            // recursive or iterative (BFS/DFS)
            cascadeSoftDelete(child.modelName, child._id, actorId, session)

        commit(session)
        return doc
    catch e:
        rollback(session)
        throw e

function listOwnedChildrenFor(doc, session):
    // Use organization and department scoping for performance and safety
    switch doc.modelName:
        case "Organization":
            orgId = doc._id
            return union(
                idsOf("Department", { organization: orgId }, session),
                idsOf("Vendor", { organization: orgId }, session),
                idsOf("Notification", { organization: orgId }, session),
                idsOf("User", { organization: orgId }, session),
                idsOf("ProjectTask", { organization: orgId }, session),
                idsOf("RoutineTask", { organization: orgId }, session),
                idsOf("AssignedTask", { organization: orgId }, session),
                idsOf("TaskActivity", { organization: orgId }, session),
                idsOf("TaskComment", { organization: orgId }, session),
                idsOf("Attachment", { organization: orgId }, session),
                idsOf("Material", { organization: orgId }, session)
            )
        case "Department":
            orgId = doc.organization
            deptId = doc._id
            return union(
                idsOf("User", { organization: orgId, department: deptId }, session),
                idsOf("ProjectTask", { organization: orgId, department: deptId }, session),
                idsOf("RoutineTask", { organization: orgId, department: deptId }, session),
                idsOf("AssignedTask", { organization: orgId, department: deptId }, session),
                idsOf("TaskActivity", { organization: orgId, department: deptId }, session),
                idsOf("TaskComment", { organization: orgId, department: deptId }, session),
                idsOf("Attachment", { organization: orgId, department: deptId }, session),
                idsOf("Material", { organization: orgId, department: deptId }, session)
            )
        case "ProjectTask" | "RoutineTask" | "AssignedTask":
            taskId = doc._id
            // direct children
            return union(
                idsOf("TaskActivity", { parent: taskId }, session),
                idsOf("TaskComment", { parent: taskId }, session),
                idsOf("Attachment", { parent: taskId }, session)
            )
        case "TaskActivity":
            actId = doc._id
            return union(
                idsOf("TaskComment", { parent: actId }, session),
                idsOf("Attachment", { parent: actId }, session)
            )
        case "TaskComment":
            comId = doc._id
            return union(
                idsOf("TaskComment", { parent: comId }, session),
                idsOf("Attachment", { parent: comId }, session)
            )
        default:
            return []


// Restoration: strict, top-down, no auto-restore of children

function strictRestore(modelName, id, actorId, session, options = { withChildren: false }):
    beginTransaction(session)
    try:
        doc = fetchWithDeleted(Model(modelName), { _id: id }, session).findOne()
        if doc == null:
            commit(session); return null

        ensureOrgBoundary(doc, actorOrgIdOf(actorId))

        // Strict checks
        strictParentCheck(doc, session)
        validateCriticalDependencies(doc, session)
        doc = repairNonBlockingOnRestore(doc, session)
        // Save any repairs prior to restore
        doc.save({ session })

        // Perform plugin restore
        if isDeleted(doc):
            doc.restore(actorId, { session })
        // else no-op

        // Optionally orchestrate children restore (still strict, top-down)
        if options.withChildren == true:
            children = listOwnedChildrenFor(doc, session)
            // Restore in order defined by 'orders.restoration' per type
            orderedChildren = orderByRestorationSemantics(children)
            for each child in orderedChildren:
                strictRestore(child.modelName, child._id, actorId, session, { withChildren: true })

        commit(session)
        return doc
    catch e:
        rollback(session)
        throw e

function orderByRestorationSemantics(children):
    // Sort children by the global restoration order
    priority = {
        "Department": 1,
        "User": 2,
        "ProjectTask": 3,
        "RoutineTask": 4,
        "AssignedTask": 5,
        "TaskActivity": 6,
        "TaskComment": 7,
        "Attachment": 8,
        "Material": 9,
        "Vendor": 10,
        "Notification": 99 // not restored
    }
    return sort(children, (a, b) => priority[a.modelName] - priority[b.modelName])
```

---

## Cascade Operation

---

```json
{
  "analysis": {
    "explicit_statement_check": {
      "status": "YES",
      "where_stated": "Parent Integrity Constraint for Restoration: 'A resource cannot be restored if any direct or indirect parent is soft-deleted (isDeleted === true).' Present in global.parentIntegrityConstraint and reinforced in per-entity restorePrerequisites.",
      "explanation": "The policy now explicitly codifies the rule, elevating it from implied practice to a first-class constraint enforced before calling plugin restore()."
    },
    "implied_coverage": {
      "present": true,
      "where_implied": [
        {
          "section": "Global.validations.globalPreRestore",
          "content": "Parent Integrity Constraint and re-validation immediately before restore inside a transaction."
        },
        {
          "section": "entities.BaseTask.restorePrerequisites",
          "content": "Validate Organization, Department, and createdBy user exist and are not soft-deleted."
        },
        {
          "section": "entities.TaskActivity.restorePrerequisites",
          "content": "Validate parent task exists and is active; createdBy and materials active."
        },
        {
          "section": "entities.TaskComment.restorePrerequisites",
          "content": "Validate parent chain to root is active and acyclic; createdBy active."
        }
      ],
      "implementation_level": "Service-layer strict guards with transactions; plugin restore() remains side-effect only, without reference checks."
    },
    "missing_explicit_rule": {
      "status": "ADDRESSED",
      "details": "Added 'Parent Integrity Constraint for Restoration' as a dedicated, explicit rule. Also formalized critical dependency validation.",
      "recommended_addition": "N/A (incorporated)."
    },
    "current_coverage_of_concept": {
      "dependency_validation": "Explicit and per-entity, including createdBy, vendor, materials, and assignees.",
      "reference_integrity_checks": "Explicit for parent references and critical dependencies; weak refs are pruned, not blocking.",
      "restoration_blocking_conditions": "Explicit with error codes and pseudocode guards.",
      "parent_status_validation": "Explicit and mandatory across all restore flows."
    }
  },
  "deletion": {
    "involved_resources": [
      "Organization",
      "Department",
      "User",
      "ProjectTask",
      "RoutineTask",
      "AssignedTask",
      "TaskActivity",
      "TaskComment",
      "Attachment",
      "Material",
      "Vendor",
      "Notification"
    ],
    "resource_deletion_order": [
      "Organization",
      "Department",
      "User",
      "ProjectTask",
      "RoutineTask",
      "AssignedTask",
      "TaskActivity",
      "TaskComment",
      "Attachment",
      "Material",
      "Vendor",
      "Notification"
    ],
    "edge_cases_for_deletion_order": [
      {
        "name": "Child already deleted",
        "risk": "Audit overwrite",
        "solution": "Deletion must be idempotent; skip .softDelete() when isDeleted === true; do not overwrite deletedBy/deletedAt."
      },
      {
        "name": "Partial cascade failure",
        "risk": "Half-deleted tenant",
        "solution": "Use MongoDB transactions or resumable background cascade jobs with checkpoints and retries."
      },
      {
        "name": "Cross-organization reference bug",
        "risk": "Data leak",
        "solution": "Every cascade query MUST include organizationId; validate org boundary in service layer."
      },
      {
        "name": "Weak references",
        "risk": "Accidental cascade via watchers/assignees/mentions",
        "solution": "Weak references NEVER cascade; ignore during deletion."
      }
    ],
    "additional_edge_cases": [
      {
        "name": "Department deleted; tasks still point to it",
        "handling": "Tasks are owned by Department and must be soft-deleted in the cascade."
      },
      {
        "name": "HOD deleted before department",
        "handling": "HOD is nullable; no cascade needed."
      },
      {
        "name": "Notifications referencing deleted entities",
        "handling": "Always soft-delete notifications with the tenant; do not restore."
      },
      {
        "name": "TTL auto-cleanup",
        "handling": "Enable only after full cascade; TTL is irreversible."
      }
    ],
    "solutions_to_handle_edge_cases": [
      "Idempotent deletion strategy.",
      "Tenant-scoped queries with organizationId filters.",
      "Transactions or resumable job architecture.",
      "Ignore weak refs in cascade."
    ]
  },
  "restoration": {
    "involved_resources": [
      "Organization",
      "Department",
      "User",
      "ProjectTask",
      "RoutineTask",
      "AssignedTask",
      "TaskActivity",
      "TaskComment",
      "Attachment",
      "Material",
      "Vendor"
    ],
    "resource_restoration_order": [
      "Organization",
      "Department",
      "User",
      "ProjectTask",
      "RoutineTask",
      "AssignedTask",
      "TaskActivity",
      "TaskComment",
      "Attachment",
      "Material",
      "Vendor"
    ],
    "strict_mode": {
      "rule": "IF any parent.isDeleted === true THEN block restore",
      "applies_to": "Organization, Department, parent task/activity/comment chains and all structural parents."
    },
    "edge_cases_for_restoration_order": [
      {
        "name": "Restore Department while Organization is deleted",
        "result": "Blocked",
        "solution": "Restore Organization first."
      },
      {
        "name": "Restore Task while Department is deleted",
        "result": "Blocked",
        "solution": "Restore Department first."
      },
      {
        "name": "Restore User while Department is deleted",
        "result": "Blocked",
        "solution": "Restore Department first."
      }
    ],
    "additional_edge_cases": [
      {
        "name": "Selective restore",
        "allowed": true,
        "rule": "Restoring Organization does not auto-restore children."
      },
      {
        "name": "Schema evolution during deletion window",
        "solution": "Migration-on-restore; lazy defaults."
      },
      {
        "name": "restoredBy user deleted",
        "handling": "Allowed; audit truth preserved."
      },
      {
        "name": "TTL hard delete",
        "result": "Restore impossible; TTL is irreversible."
      },
      {
        "name": "AssignedTask with all assignees deleted",
        "handling": "Block with ASSIGNED_TASK_NO_ACTIVE_ASSIGNEES."
      },
      {
        "name": "Parent soft-deleted during restoration",
        "resolution": "Re-validate immediately before restore within a transaction; optimistic locking."
      }
    ],
    "solutions_to_handle_edge_cases": [
      "Strict parent check prior to restore; re-check within the same transaction.",
      "Critical dependency validation per entity (createdBy, vendor, materials, assignees).",
      "Non-blocking repair: prune mentions/watchers, auto-null invalid HOD, fix attachment scope.",
      "No auto-restore of children; top-down orchestration only when explicitly requested."
    ]
  },
  "plugin_behavior": {
    "softDelete": "Sets isDeleted=true, deletedAt=nowUTC, deletedBy=actor; clears restoredAt/restoredBy",
    "restore": "Sets isDeleted=false, clears deletedAt/deletedBy; sets restoredAt=nowUTC, restoredBy=actor",
    "softDeleteById/restoreById": "Convenience statics; restoreById uses withDeleted(); plugin does not validate references or parents",
    "query_filtering": "Pre-hooks to exclude isDeleted=true unless withDeleted()/onlyDeleted() used",
    "hard_delete_protection": "Pre-hooks block deleteOne/deleteMany/findOneAndDelete/remove",
    "ttl_index": "Optional TTL on deletedAt with partialFilter isDeleted=true"
  },
  "conclusion": "The system now formalizes hierarchical soft deletion and strict, top-down restoration. Parent integrity is an explicit, enforced rule; critical dependencies are validated per resource; weak references are pruned and never cascade. Multi-tenant boundaries are enforced across all operations. Transactions or resumable jobs ensure robustness under failures, and TTL is only enabled post-cascade where irreversible deletion is acceptable."
}
```
