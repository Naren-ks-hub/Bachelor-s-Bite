const http = require('http');
const app = require('../server/app');

let server;
const TEST_PORT = 3099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting BachelorBite API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check test
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'GET /api/health returns 200 OK');

    // 2. Fetch recipes test
    const recipesRes = await makeRequest('GET', '/api/recipes');
    assert(recipesRes.status === 200 && recipesRes.body.count >= 6, `GET /api/recipes returns all seeded recipes (${recipesRes.body.count})`);

    // 3. Filter recipes by budget
    const budgetFiltered = await makeRequest('GET', '/api/recipes?budget_max=50');
    const allUnder50 = budgetFiltered.body.recipes.every(r => r.budget_inr <= 50);
    assert(budgetFiltered.status === 200 && allUnder50 && budgetFiltered.body.count > 0, 'GET /api/recipes?budget_max=50 filters correctly');

    // 4. Fetch single recipe detail by slug
    const singleRecipe = await makeRequest('GET', '/api/recipes/garlic-butter-chili-noodles');
    assert(
      singleRecipe.status === 200 &&
      singleRecipe.body.title === 'Garlic Butter Chili Noodles' &&
      Array.isArray(singleRecipe.body.steps) &&
      singleRecipe.body.steps.length > 0,
      'GET /api/recipes/:slug returns recipe details and cooking steps'
    );

    // 5. Intelligent pantry matcher
    const matchRes = await makeRequest('POST', '/api/recipes/match', {
      ingredients: ['Eggs', 'Cheese', 'Butter']
    });
    assert(
      matchRes.status === 200 &&
      matchRes.body.recipes.length > 0 &&
      matchRes.body.recipes[0].slug === 'crispy-egg-cheese-toast-fold' &&
      matchRes.body.recipes[0].match_score >= 60,
      'POST /api/recipes/match ranks Egg & Cheese Toast highest for matching ingredients'
    );

    // 6. Lead creation with validation
    const invalidEmailRes = await makeRequest('POST', '/api/leads', {
      name: 'Test Bachelor',
      email: 'not-an-email',
      phone: '9876543210'
    });
    assert(invalidEmailRes.status === 400, 'POST /api/leads rejects invalid email');

    const testEmail = `bachelor_${Date.now()}@example.com`;
    const validLeadRes = await makeRequest('POST', '/api/leads', {
      name: 'Alex Kumar',
      email: testEmail,
      phone: '+91 98765 43210'
    });
    assert(validLeadRes.status === 201 && validLeadRes.body.success === true, 'POST /api/leads saves new lead into database');

    // 7. Duplicate lead handling
    const duplicateLeadRes = await makeRequest('POST', '/api/leads', {
      name: 'Alex Kumar',
      email: testEmail,
      phone: '+91 98765 43210'
    });
    assert(duplicateLeadRes.status === 200 && duplicateLeadRes.body.message.includes('already on the access list'), 'POST /api/leads handles duplicates gracefully');

    // 8. Fetch collections
    const collectionsRes = await makeRequest('GET', '/api/collections');
    assert(collectionsRes.status === 200 && collectionsRes.body.count === 4, 'GET /api/collections returns 4 situational collections');

    console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed\n`);
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

server = app.listen(TEST_PORT, () => {
  runTests();
});
