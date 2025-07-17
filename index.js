const express = require('express')
require('dotenv').config()
const app = express()
const jwt = require('jsonwebtoken')
const cors = require('cors')
const port = process.env.PORT || 5000
const { ObjectId } = require('mongodb')

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
    // await client.connect()

    const doctorsCollection = client.db('hashi').collection('doctors')
    const userCollection = client.db('hashi').collection('users')
    const appointmentCollection = client.db('hashi').collection('appointment')
    const reviewsCollection = client.db('hashi').collection('reviews')

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({ token })
    })

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization)
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded
        next()
      })
    }

    // doctor related api
    app.post('/doctors', async (req, res) => {
      const booked = req.body
      const result = await doctorsCollection.insertOne(booked)
      res.send(result)
    })

    app.get('/doctors', async (req, res) => {
      const result = await doctorsCollection.find().toArray()
      res.send(result)
    })

    app.delete('/doctors/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await doctorsCollection.deleteOne(query)
      res.send(result)
    })

    // user related apis
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

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

    app.get('/users/role/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Unauthorized access' })
      }
      const query = { email: email }
      const user = await userCollection.findOne(query)

      // const admin = user.role === 'admin'
      const role = user.role

      res.send({ role })
    })

    app.patch('/users/role/:id', async (req, res) => {
      const id = req.params.id
      const { role } = req.body
      const allowedRoles = ['tourist', 'guide', 'admin']
      if (!allowedRoles.includes(role)) {
        return res.status(400).send({ message: 'Invalid role specified.' })
      }
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: { role: role }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.patch(
      '/users/guide/:id',
      // ve
      // verifyToken,
      // verifyAdmin,
      async (req, res) => {
        const id = req.params.id
        const { role } = req.body
        const filter = { _id: new ObjectId(id) }
        const updatedDoc = {
          $set: { role }
        }
        const result = await userCollection.updateOne(filter, updatedDoc)
        res.send(result)
      }
    )

    app.get('/user', async (req, res) => {
      const email = req.query.email
      const result = await userCollection.findOne({ email })
      res.send(result)
    })

    app.put('/users/:id', async (req, res) => {
      const { id } = req.params
      const updateData = req.body
      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      res.send(result)
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    // appointment related api
    app.post('/appointment', async (req, res) => {
      const booked = req.body
      const result = await appointmentCollection.insertOne(booked)
      res.send(result)
    })

    app.get('/appointment', async (req, res) => {
      const result = await appointmentCollection.find().toArray()
      res.send(result)
    })

    app.get('/appointments', async (req, res) => {
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
      const { review, name, date } = req.body
      const result = await reviewsCollection.insertOne({ review, name, date })
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
        .aggregate([{ $sample: { size: 2 } }])
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
