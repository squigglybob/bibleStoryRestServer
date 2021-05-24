const express = require('express')
const auth = require('express-basic-auth')
const csv = require('csvtojson')
const fetch = require('node-fetch')
require('dotenv').config()

const port = process.env.PORT || 8080
const API_KEY = process.env.AUTHORISATION_TOKEN
const API_URL = 'https://api.esv.org/v3/passage/text/'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

let jesusStories = []

const jesusStoriesFilePath = 'data/jesus-stories-categories.csv'
async function loadJesusStories() {
    const storiesInOrder = await csv().fromFile(jesusStoriesFilePath)
    const storiesByType = {}
    storiesInOrder.forEach((story) => {
        const types = story.Type.split(',')
        types.forEach((type) => {
            const storyType = type.trim().toLowerCase()
            if (!storiesByType[storyType]) {
                storiesByType[storyType] = []
            }
            if (story.Matthew !== '') {
                storiesByType[storyType].push(`Matthew ${story.Matthew}`)
            } else if (story.Mark !== '') {
                storiesByType[storyType].push(`Mark ${story.Mark}`)
            } else if (story.Luke !== '') {
                storiesByType[storyType].push(`Luke ${story.Luke}`)
            } else if (story.John !== '') {
                storiesByType[storyType].push(`John ${story.John}`)
            }
        })
    })
    return storiesByType
}

function getRandomStory(storiesByType, storyType) {
    if (!storiesByType[storyType]) {
        return false
    }
    const possibleStories = storiesByType[storyType]
    const storyRef = possibleStories[Math.floor(Math.random() * possibleStories.length)]
    return storyRef
}

function makeResponse(text) {
    return {
        fulfillmentText: text,
        speech: text,
        displayText: text,
        source: "webhook-biblestory-api"
    }
}

const server = express()
server.use(auth({
    users: {
        'admin': ADMIN_PASSWORD || '',
    },
}))
server.use(express.urlencoded())
server.use(express.json())

const followUpIntent = 'defaultwelcomeintent-followup'

server.post('/getStory', async (req, res) => {
    let storyResponse = `Terribly sorry, but I'm having trouble my end. Try later.`
    const outputContexts = req.body.queryResult.outputContexts

    const storyTypeContext = outputContexts.find((context) => context.name.includes(followUpIntent))

    if (!storyTypeContext) {
        return res.json(makeResponse(`Sorry got the wrong context there. Expected ${followUpIntent}`))
    }

    const { storytype, genre } = storyTypeContext.parameters


    let storyRef = getRandomStory(jesusStories, storytype.toLowerCase())
    if (storyRef) {
        const url = new URL(API_URL)
        url.searchParams.append('q', storyRef)
        fetch(url.href, {
            headers: {
                Authorization: `Token ${API_KEY}`
            }
        })
        .then((res) => res.json())
        .then((json) => {
            if (json.passages) {
                storyResponse = json.passages
            }
        })
        .finally(() => {
            return res.json(makeResponse(storyResponse))
        })
    }
})

server.listen(port, async () => {
    jesusStories = await loadJesusStories()
    console.log(`Server listening on port ${port}`)
})