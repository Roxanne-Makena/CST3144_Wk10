const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

app.use(express.json()); // for parsing application/json
app.set('port',3000);

//Configure CORS - Cross-Origin Resource Sharing
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers',
        'Origin, Accept, X-Requested-With, Content-Type');
 
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
 
    next();
});

//Connect to MongoDB
const url = 'mongodb+srv://makenaroxanne44_db_user:wedcst@gettingstarted.5xtoyve.mongodb.net/'

const client = new MongoClient(url);
let db;

async function startServer() {
    try {
        await client.connect();

        console.log("Connected successfully to MongoDB");
        db = client.db('webstore');

        //Root path
        app.get('/', (req, res) => {
            res.send('Select a collection, e.g. /collection/messages');
        });

        //Get collection name
        app.param('collectionName', (req, res, next, collectionName) => {
            req.collection = db.collection(collectionName);
            next();
        });

        //Retrieve all objects
        app.get('/collection/:collectionName', async (req, res, next) => {
            try {
                const results = await req.collection.find({}).toArray();
                res.send(results);
            } catch (error) {
                next(error);
            }
        });

        //Insert a new object
        app.post('/collection/:collectionName', async (req, res, next) => {
            try {
                const result = await req.collection.insertOne(req.body);
                res.status(201).send({
                    msg: 'successfully inserted',
                    insertedID: result.insertedId
                });
            } catch (error) {
                next(error);
            }
        }); 

        //Retrieve an object by ObjectID
        app.get('/collection/:collectionName/:id', async (req, res, next) => {
            try {
                if (!ObjectId.isValid(req.params.id)) {
                    return res.status(400).send({ msg: "Invalid ObjectID" });
                }
                
                const result = await req.collection.findOne({
                    _id: new ObjectId(req.params.id)
                });
            
                res.send(result);
            } catch (error) {
                next(error);
            }
        });

        // Modyfy an object by ObjectID
        app.put('/collection/:collectionName/:id', async (req, res, next) => {
            try {
                if (!ObjectId.isValid(req.params.id)) {
                    return res.status(400).send({ msg: "Invalid ObjectID" });
                }
                
                const result = await req.collection.updateOne(
                    { _id: new ObjectId(req.params.id) },
                    { $set: req.body }
                );
            
                res.send(
                    result.matchedCount === 1 ? { msg: 'successfully updated' } : { msg: 'error. no object found' }
                );
            } catch (err) {
                next(err);
            }
        });

        //Delete an object by ObjectID
        app.delete('/collection/:collectionName/:id', async (req, res, next) => {
            try {
                if (!ObjectId.isValid(req.params.id)) {
                    return res.status(400).send({ msg: "Invalid ObjectID" });
                }
                
                const result = await req.collection.deleteOne({
                    _id: new ObjectId(req.params.id)
                });
            
                res.send(
                    result.deletedCount === 1 ? { msg: 'successfully deleted' } : { msg: 'error. no object found' }
                );
            } catch (err) {
                next(err);
            }
        });

        //Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err);
            res.status(500).send({ error: "Server error" });
        });

        //Port environment
        const port = process.env.PORT || 3000;

        app.listen(port, () => {
            console.log(`Express.js server is running on port ${port}`);
        });


    } catch (error) {
        console.error('MongoDB connection failed:', error);
    }
}

startServer();
