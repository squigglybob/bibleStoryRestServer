const express = require('express')

const port = process.env.PORT || 8080

const server = express()

server.use(express.urlencoded())
server.use(express.json())

/**
 * "outputContexts": [
      {
        "name": "projects/biblestorybot-famy/agent/sessions/385071f7-9b4f-b48f-1c58-02b423386f60/contexts/story_genre_intent-followup",
        "lifespanCount": 1,
        "parameters": {
          "storytype": "Healing",
          "genre": "Jesus",
          "storytype.original": "healing",
          "genre.original": "jesus"
        }
      }
    ],
 */

const storyGenreFollowUpIntent = 'story_genre_intent-followup'

server.post('/getStory', (req, res) => {
    const outputContexts = req.body.queryResult.outputContexts

    const storyTypeContext = outputContexts.find((context) => context.name.includes(storyGenreFollowUpIntent))

    const { storytype, genre } = storyTypeContext.parameters

    // TODO: get a random story of this genre and storytype

    // TODO: get the bible text
    const storyResponse = `Let me just get a ${genre} story about ${storytype} for you`

    return res.json({
        fulfillmentText: storyResponse,
        speech: storyResponse,
        displayText: storyResponse,
        source: "webhook-biblestory-api"
    });
})

server.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})