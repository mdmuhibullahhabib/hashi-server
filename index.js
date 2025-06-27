const express = require('express')
require('dotenv').config()
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion } = require('mongodb')
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w5eri.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

async function run () {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect()

    const doctorsCollection = client.db('hashi').collection('doctors')
    const userCollection = client.db('hashi').collection('users')
    const appointmentCollection = client.db('hashi').collection('appointment')

    app.get('/doctors', async (req, res) => {
      const result = await doctorsCollection.find().toArray()
      res.send(result)
    })

    // user related apis
    app.post('/users', async (req, res) => {
      const user = req.body
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

        // appointment related api
    app.post('/appointment', async (req, res) => {
      const booked = req.body
      const result = await appointmentCollection.insertOne(booked)
      res.send(result)
    })

    // app.get('/assigned-tours/:name', async (req, res) => {
    //   const name = req.params.name
    //   const result = await appointmentCollection
    //     .find({ tourGuideName: name })
    //     .toArray()
    //   res.send(result)
    // })

    app.get('/appointment', async (req, res) => {
      const email = req.query.email
      const query = { email: email }
      const result = await appointmentCollection.find(query).toArray()
      res.send(result)
    })

    app.patch('/appointment/:id', async (req, res) => {
      const id = req.params.id
      const result = await appointmentCollection.updateOne(
        { _id: new ObjectId(id), status: 'pending' },
        { $set: { status: 'in-review' } }
      )
      res.send(result)
    })

    app.delete('/appointment/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await appointmentCollection.deleteOne(query)
      res.send(result)
    })


   // reviews related api
    app.post('/reviews', async (req, res) => {
      const story = req.body
      const result = await reviewsCollection.insertOne(story)
      res.send(result)
    })

    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray()
      res.send(result)
    })

    app.get('/reviews', async (req, res) => {
      const email = req.query.email
      const query = { email: email }
      const result = await reviewsCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/reviews-random', async (req, res) => {
      const result = await reviewsCollection
        .aggregate([{ $sample: { size: 4 } }])
        .toArray()
      res.send(result)
    })

    app.delete('/review/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await reviewsCollection.deleteOne(query)
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('hashi in running...')
})

app.listen(port, () => {
  console.log(`hashi is running on port ${port}`)
})
