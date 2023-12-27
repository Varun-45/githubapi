const express = require('express');
const axios = require('axios');
const path = require('path')
const { request, gql } = require('graphql-request');
require('dotenv').config();
const app = express();
const port = 3000;
const static_path = path.join(__dirname, "./public");
app.use(express.static(static_path));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

// GitHub API endpoints
const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
});
// GitHub API endpoint for GraphQL

const githubGraphQLAPI = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${process.env.TOKEN}`,
  },
});

// GraphQL query to get events for the last year
const graphqlQuery = `
  query($username: String!, $since: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $since) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

// Endpoint to retrieve the contribution graph data
app.get('/contribution-graph/:username', async (req, res) => {
  try {
    // Calculate the timestamp for one year ago
    const githubUsername = req.params['username']
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const response = await githubGraphQLAPI.post('', {
      query: graphqlQuery,
      variables: {
        username: githubUsername,
        since: oneYearAgo.toISOString(),
      },
    });

    const contributionData = response.data.data.user.contributionsCollection.contributionCalendar;
    res.json(contributionData)

  } catch (error) {
    console.error('Error retrieving contribution graph:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to retrieve and display the repository image
app.get('/repositories/:username', async (req, res) => {
  try {
    const githubUsername = req.params['username']

    const response = await githubAPI.get(`/users/${githubUsername}/repos`);
    const repositories = response.data;
    console.log(repositories);
    res.json(repositories)
  } catch (error) {
    console.error('Error retrieving repository image:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
