// Define your models as classes with a static properties attribute:
export class User {
  static table = 'users'
  static properties = {
    id: {
      type: String,
      primaryKey: true,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    age: {
      type: Number,
    },
    data: {
      type: Object,
    },
  }
}
