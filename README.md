# DEEL BACKEND TASK

## Further Improvements
I apologize for the code: I did Not have time for refactoring. 

What I would improve if I had more time:
1. **Input validation**. The Endpoints #4, #5, #6 and #7 accept input as a request body, in-url parameters or GET query parameters. These inputs have to be properly validated. A library like [yup](https://www.npmjs.com/package/yup) can be used.
2. **Precise Financial calculations**. There is no high precision data type (e.g. `BigDecimal` in Java) in Javascript. We have to use some kind of library like [Dinero.js](https://dinerojs.com/).
3. **Concurrent Db Transactions**. I used Optimistic locking to prevent concurrency issues in the endpoint #4 and #5. Maybe automatic retries make sense if the transaction fails due to optimistic lock failure (someone else changed the row by the time we update the balance - the row version is different than what we had read).
4. **Database improvements**. 
    - add `transactions` table - such tables are important part of the finance related apps;
    - `default: false` configuration is not working for the `jobs.paid` field. Investigate & fix. For now I explicitly set `paid: false` where needed.
    - SQLite is a portable single-file based database which is probably not suited for concurrent accesses. A proper RDBMS like MsSQL, PostgreSQL or MySQL should be used for production.
5. **Refactoring**. Extract and divide the files into folders:     
    - `controllers` - The controller layer should validate the input and call service layer.
    - `services` - All the business logic should go into the services.
    - `repositories` - classes that make the direct DB calls.
    - `models` - individual definitions in the `model.js` go here.

    Other suggestions for refactoring:
    - "Don't Repeat Yourself";
    - Use meaningful variable and function names;
    - Comment the complex functions/lines.

6. **Error-Handling**.
    - create classes for commonly used errors (`NotFoundException`, `BadRequestException` and etc.). 
        ```js
        throw new NotFoundException("The job is not found or you don't have enough privileges to access it.");
        ```
    - create a middleware that renders useful response in case of an exception. Use HTTP response codes along with a body structure that's agreed with the Front-end team.
7. **Tests**. I'd go with TDD here. First write tests for the known edge cases and the happy path, then start implementing the actual endpoints. I started with the actual implementation because of the time limit.
8. **Typescript**. Migrate to Typescript. The Compile time types checks can be very useful. Also this gives better IDE code-completion assistence.
9. **Code style**. Setup [eslint](https://eslint.org/). This improves code readability and coding-style consistency, especially in bigger teams.
10. **API Docs**. [Swagger](https://swagger.io/) would be a nice addition.

<br/>
<br/>

# Task description

💫 Welcome! 🎉


This backend exercise involves building a Node.js/Express.js app that will serve a REST API. We imagine you should spend around 3 hours at implement this feature.

## Data Models

> **All models are defined in src/model.js**

### Profile
A profile can be either a `client` or a `contractor`. 
clients create contracts with contractors. contractor does jobs for clients and get paid.
Each profile has a balance property.

### Contract
A contract between and client and a contractor.
Contracts have 3 statuses, `new`, `in_progress`, `terminated`. contracts are considered active only when in status `in_progress`
Contracts group jobs within them.

### Job
contractor get paid for jobs by clients under a certain contract.

## Getting Set Up

  
The exercise requires [Node.js](https://nodejs.org/en/) to be installed. We recommend using the LTS version.

  

1. Start by cloning this repository.

  

1. In the repo root directory, run `npm install` to gather all dependencies.

  

1. Next, `npm run seed` will seed the local SQLite database. **Warning: This will drop the database if it exists**. The database lives in a local file `database.sqlite3`.

  

1. Then run `npm start` which should start both the server and the React client.

  

❗️ **Make sure you commit all changes to the master branch!**

  
  

## Technical Notes

  

- The server is running with [nodemon](https://nodemon.io/) which will automatically restart for you when you modify and save a file.

- The database provider is SQLite, which will store data in a file local to your repository called `database.sqlite3`. The ORM [Sequelize](http://docs.sequelizejs.com/) is on top of it. You should only have to interact with Sequelize - **please spend some time reading sequelize documentation before starting the exercise.**

- To authenticate users use the `getProfile` middleware that is located under src/middleware/getProfile.js. users are authenticated by passing `profile_id` in the request header. after a user is authenticated his profile will be available under `req.profile`. make sure only users that are on the contract can access their contracts.
- The server is running on port 3001.

  

## APIs To Implement 

  

Below is a list of the required API's for the application.

  


1. ***GET*** `/contracts/:id` - This API is broken 😵! it should return the contract only if it belongs to the profile calling. better fix that!

2. ***GET*** `/contracts` - Returns a list of contracts belonging to a user (client or contractor), the list should only contain non terminated contracts.

3. ***GET*** `/jobs/unpaid` -  Get all unpaid jobs for a user (***either*** a client or contractor), for ***active contracts only***.

4. ***POST*** `/jobs/:job_id/pay` - Pay for a job, a client can only pay if his balance >= the amount to pay. The amount should be moved from the client's balance to the contractor balance.

5. ***POST*** `/balances/deposit/:userId` - Deposits money into the the the balance of a client, a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)

6. ***GET*** `/admin/best-profession?start=<date>&end=<date>` - Returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range.

7. ***GET*** `/admin/best-clients?start=<date>&end=<date>&limit=<integer>` - returns the clients the paid the most for jobs in the query time period. limit query parameter should be applied, default limit is 2.
```
 [
    {
        "id": 1,
        "fullName": "Reece Moyer",
        "paid" : 100.3
    },
    {
        "id": 200,
        "fullName": "Debora Martin",
        "paid" : 99
    },
    {
        "id": 22,
        "fullName": "Debora Martin",
        "paid" : 21
    }
]
```

  

## Going Above and Beyond the Requirements

Given the time expectations of this exercise, we don't expect anyone to submit anything super fancy, but if you find yourself with extra time, any extra credit item(s) that showcase your unique strengths would be awesome! 🙌

It would be great for example if you'd write some unit test / simple frontend demostrating calls to your fresh APIs.

  

## Submitting the Assignment

When you have finished the assignment, create a github repository and send us the link.

  

Thank you and good luck! 🙏
