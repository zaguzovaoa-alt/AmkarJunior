const fs = require('fs');
let code = fs.readFileSync('src/context/CRMContext.tsx', 'utf8');

code = code.replace(
  'addTask: (task: Omit<CRMTask, "id" | "status">) => void;',
  'addTask: (task: Omit<CRMTask, "id" | "status">) => void;\n  updateTask: (id: string, updates: Partial<CRMTask>) => Promise<void>;'
);

code = code.replace(
  /const completeTask = async \(id: string\) => \{[\s\S]*?\}\);[\s\S]*?\};/,
  `const completeTask = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "completed" } : t)),
    );
    updateDoc(doc(db, "tasks", id), { status: "completed" }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        \`Failed to complete task \${id} in Firestore, kept locally:\`,
        err,
      );
    });
  };

  const updateTask = async (id: string, updates: Partial<CRMTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
    updateDoc(doc(db, "tasks", id), updates).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        \`Failed to update task \${id} in Firestore, kept locally:\`,
        err,
      );
    });
  };`
);

code = code.replace(
  'completeTask,\n        addTask,',
  'completeTask,\n        updateTask,\n        addTask,'
);

fs.writeFileSync('src/context/CRMContext.tsx', code);
