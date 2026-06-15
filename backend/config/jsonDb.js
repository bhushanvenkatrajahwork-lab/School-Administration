const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection.toLowerCase()}.json`);
}

function readData(collection) {
  const file = getFilePath(collection);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`Error reading collection ${collection}:`, error);
    return [];
  }
}

function writeData(collection, data) {
  const file = getFilePath(collection);
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing collection ${collection}:`, error);
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Mimics a Mongoose query object allowing chaining like .sort().limit()
class JSONQuery {
  constructor(data, modelName) {
    this.data = data;
    this.modelName = modelName;
  }

  sort(sortObj) {
    if (!sortObj || this.data.length === 0) return this;
    const keys = Object.keys(sortObj);
    if (keys.length === 0) return this;
    const key = keys[0];
    const direction = sortObj[key]; // 1 or -1

    this.data.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      // Convert Date string/objects
      if (key === 'createdAt' || key === 'timestamp' || key === 'paymentDate' || key === 'actionedAt' || key === 'dob') {
        valA = new Date(valA || 0);
        valB = new Date(valB || 0);
      }

      if (valA < valB) return direction === 1 ? -1 : 1;
      if (valA > valB) return direction === 1 ? 1 : -1;
      return 0;
    });

    return this;
  }

  limit(count) {
    if (count && count > 0) {
      this.data = this.data.slice(0, count);
    }
    return this;
  }

  populate(field) {
    // Basic populator simulation
    // Looks up reference ids and replaces them with details from other collections if available
    if (!field || this.data.length === 0) return this;
    
    // We determine what collection to lookup based on standard fields
    let refCollection = '';
    let targetField = '';
    
    if (field === 'student') {
      refCollection = 'student.records';
      targetField = 'student';
    } else if (field === 'user') {
      refCollection = 'auth.users';
      targetField = 'user';
    } else if (field === 'actionedBy') {
      refCollection = 'auth.users';
      targetField = 'actionedBy';
    } else if (field === 'updatedBy') {
      refCollection = 'auth.users';
      targetField = 'updatedBy';
    }

    if (refCollection && targetField) {
      const refData = readData(refCollection);
      this.data = this.data.map(item => {
        const copy = { ...item };
        const refId = copy[targetField];
        if (refId) {
          const referencedObj = refData.find(r => r._id === refId || r.studentId === refId || r.admissionNumber === refId);
          if (referencedObj) {
            // Remove sensitive fields if user
            if (refCollection === 'users') {
              const { password, ...safeUser } = referencedObj;
              copy[targetField] = safeUser;
            } else {
              copy[targetField] = referencedObj;
            }
          }
        }
        return copy;
      });
    }

    return this;
  }

  // Promise-like behavior so caller can do: await Model.find().sort().limit()
  then(onFulfilled, onRejected) {
    return Promise.resolve(this.data).then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return Promise.resolve(this.data).catch(onRejected);
  }
}

// Wrapper mimicking a Mongoose Model
class JSONModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  find(query = {}) {
    const list = readData(this.collectionName);
    const filtered = list.filter(item => matchQuery(item, query));
    return new JSONQuery(filtered, this.collectionName);
  }

  findOne(query = {}) {
    const list = readData(this.collectionName);
    const found = list.find(item => matchQuery(item, query));
    return Promise.resolve(found || null);
  }

  findById(id) {
    if (!id) return Promise.resolve(null);
    const list = readData(this.collectionName);
    const found = list.find(item => item._id === id.toString());
    return Promise.resolve(found || null);
  }

  create(doc) {
    const list = readData(this.collectionName);
    const newDoc = {
      _id: generateId(),
      createdAt: new Date().toISOString(),
      ...doc
    };
    list.push(newDoc);
    writeData(this.collectionName, list);
    return Promise.resolve(newDoc);
  }

  findByIdAndUpdate(id, update, options = { new: true }) {
    if (!id) return Promise.resolve(null);
    const list = readData(this.collectionName);
    const idx = list.findIndex(item => item._id === id.toString());
    if (idx === -1) return Promise.resolve(null);

    const oldItem = list[idx];
    const updateFields = update.$set || update;
    
    const updatedItem = {
      ...oldItem,
      ...updateFields,
      updatedAt: new Date().toISOString()
    };

    list[idx] = updatedItem;
    writeData(this.collectionName, list);
    return Promise.resolve(updatedItem);
  }

  findOneAndUpdate(query, update, options = { new: true }) {
    const list = readData(this.collectionName);
    const idx = list.findIndex(item => matchQuery(item, query));
    if (idx === -1) return Promise.resolve(null);

    const oldItem = list[idx];
    const updateFields = update.$set || update;

    const updatedItem = {
      ...oldItem,
      ...updateFields,
      updatedAt: new Date().toISOString()
    };

    list[idx] = updatedItem;
    writeData(this.collectionName, list);
    return Promise.resolve(updatedItem);
  }

  updateOne(query, update) {
    return this.findOneAndUpdate(query, update).then(res => ({ nModified: res ? 1 : 0 }));
  }

  deleteOne(query) {
    const list = readData(this.collectionName);
    const idx = list.findIndex(item => matchQuery(item, query));
    if (idx === -1) return Promise.resolve({ deletedCount: 0 });

    list.splice(idx, 1);
    writeData(this.collectionName, list);
    return Promise.resolve({ deletedCount: 1 });
  }

  deleteMany(query = {}) {
    const list = readData(this.collectionName);
    const remaining = list.filter(item => !matchQuery(item, query));
    const deletedCount = list.length - remaining.length;
    writeData(this.collectionName, remaining);
    return Promise.resolve({ deletedCount });
  }

  countDocuments(query = {}) {
    const list = readData(this.collectionName);
    const filtered = list.filter(item => matchQuery(item, query));
    return Promise.resolve(filtered.length);
  }
}

// Helpers for query evaluation
function matchQuery(item, query) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const key in query) {
    const queryVal = query[key];
    const itemVal = item[key];

    // Regex queries
    if (queryVal && typeof queryVal === 'object' && queryVal.$regex) {
      const regex = new RegExp(queryVal.$regex, queryVal.$options || 'i');
      if (!regex.test(itemVal || '')) return false;
      continue;
    }

    // $in queries
    if (queryVal && typeof queryVal === 'object' && queryVal.$in) {
      if (!Array.isArray(queryVal.$in)) return false;
      if (!queryVal.$in.includes(itemVal)) return false;
      continue;
    }

    // $ne queries
    if (queryVal && typeof queryVal === 'object' && queryVal.$ne !== undefined) {
      if (itemVal === queryVal.$ne) return false;
      continue;
    }

    // Standard field check
    if (itemVal !== queryVal) {
      return false;
    }
  }
  return true;
}

module.exports = {
  JSONModel,
  readData,
  writeData
};
