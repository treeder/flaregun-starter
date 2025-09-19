// Define your models as classes with a static properties attribute:
export class Product {
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
    description: {
      type: String,
    },
    price: {
      type: Number,
    },
    data: {
      type: Object, // this will be stored as a JSON object so you can stuff anything in here and still query on it. 
    }
  }
}
