const fetch = require('node-fetch');

// it.only runs only this test in jest 

const basePath = 'https://my-bookshop-srv-exhausted-wolverine-ow.cfapps.us10.hana.ondemand.com'


describe('Route GET /catalog/Authors', () => {

    // Test Authors endpoint for 200 status
    it('gets /Authors endpoint returns 200 OK status', () => {
        return fetch(`${basePath}/catalog/Authors`)
            .then(response => {
                // console.log(response)
                expect(response.status).toBe(200)
                return response.json()
            })
            .then(data => {
                console.log(data)
                expect(data.value).toHaveLength(4)
                expect(data.value.map(author => author.ID)).toEqual([
                    101,
                    107,
                    150,
                    170,
                ])
                expect(data.value.map(author => author.name)).toEqual([
                    'Emily Brontë',
                    'Charlote Brontë',
                    'Edgar Allen Poe',
                    'Richard Carpenter',
                ])
                let singleAuthor = data.value.find(author => author.ID === 107)
                console.log(data)
                expect(singleAuthor.ID).toBe(107)
                expect(singleAuthor.name).toBe("Charlote Brontë")
            })
    })

    // Test Authors:id endpoint for 200 status 
    it('gets Author id = 107, returns 200 OK status', () => {
        return fetch(`${basePath}/catalog/Authors(107)`)
            .then(response => {
                // console.log(response)
                expect(response.status).toBe(200)
                return response.json()
            })
            .then(data => {
                console.log(data)
                expect(data).toHaveProperty('ID')
                expect(data).toHaveProperty('name')
                expect(data.ID).toBe(107)
                expect(data.name).toBe("Charlote Brontë")
            })
    })

    // Test empty Authors:id endpoint for 400 status
    it('gets /Authors() with empty id value to return 400 status', () => {
        return fetch(`${basePath}/catalog/Authors()`)
            .then(response => {
                console.log(response)
                expect(response.status).toBe(400)
                return response.json()
            })
            .then(data => {
                console.log(data)
                expect(data.error.code).toBe('400')
            })
    })

})

describe('Route GET /catalog/Books', () => {

    // Test Books endpoint for 200 status
    it('gets /Books endpoint returns 200 OK status', () => {
        return fetch(`${basePath}/catalog/Books`)
            .then(response => {
                expect(response.status).toBe(200)
                return response.json()
            })
            .then(data => {
                expect(data.value).toHaveLength(5)
                expect(data.value.map(bookid => bookid.ID)).toEqual([
                    201,
                    207,
                    251,
                    252,
                    271,
                ])
                let book = data.value.find(book => book.ID === 271)
                expect(book).toHaveProperty('ID')
                expect(book).toHaveProperty('title')
                expect(book).toHaveProperty('author_ID')
                expect(book).toHaveProperty('stock')
                expect(book.ID).toBe(271)
                expect(book.title).toBe('Catweazle')
                expect(book.author_ID).toBe(170)
                expect(book.stock).toBeGreaterThan(-1)
            })
    })

    // Test Books:id endpoint for 200 status 
    it.only('gets Book id = 251, returns 200 OK status', () => {
        return fetch(`${basePath}/catalog/Books(251)`)
            .then(response => {
                expect(response.status).toBe(200)
                return response.json()
            })
            .then(data => {
                expect(data).toHaveProperty('ID')
                expect(data).toHaveProperty('title')
                expect(data).toHaveProperty('author_ID')
                expect(data).toHaveProperty('stock')
                expect(data.ID).toBe(251)
                expect(data.title).toBe('The Raven -- 11% discount!')
                expect(data.author_ID).toBe(150)
                expect(data.stock).toBeGreaterThan(-1)
            })
    })

    // Test Book if it has correct syntax for 11% discount  
    it('gets /Books(252) to check it has proper discount syntax (11%)', () => {
        return fetch(`${basePath}/catalog/Books(252)`)
            .then(response => {
                expect(response.status).toBe(200)
                return response.json()
            })
            .then(data => {
                expect(data.title).toMatch(/ -- 11% discount!/)
            })
    })

    // Test empty Books:id endpoint for 400 status
    it('gets /Books() with empty id value to return 400 status', () => {
        return fetch(`${basePath}/catalog/Books()`)
            .then(response => {
                expect(response.status).toBe(400)
                return response.json()
            })
            .then(data => {
                expect(data.error.code).toBe('400')
            })
    })

})

describe('Route POST /Orders', () => {

    // Stock refresh for book ID = 201 to amount = 12
    beforeEach(() => {
        let bookData = {
            "ID": 201,
            "title": "Wuthering Heights",
            "author_ID": 101,
            "stock": 12
        }

        return fetch(`${basePath}/catalog/Books(201)`, {
            method: "PUT",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(bookData)
        })
            .then(response => {
                console.log(response)
                if(!response.ok) return Promise.reject("Stock refresh failed")
            })
    })

    // Test Orders endpoint (without UUID) - Book ID = 201 for created status 
    it('Create Order for book 201, reducing stock amount by 1', () => {
        return fetch(`${basePath}/catalog/Orders`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({"book_ID": 201, "amount": 1})
            })
            .then(response => {
                expect(response.status).toBe(201)
                return response.json()
            })
            .then(data => {
                expect(data).toHaveProperty('createdAt')
                expect(data).toHaveProperty('modifiedAt')
                expect(data).toHaveProperty('createdBy')
                expect(data).toHaveProperty('modifiedBy')
                expect(data).toHaveProperty('book_ID')
                expect(data).toHaveProperty('ID')
                expect(data).toHaveProperty('country_code')
                expect(data).toHaveProperty('amount')
                expect(data.createdAt).toBeDefined()
                expect(data.modifiedAt).toBeDefined()
                expect(data.createdBy).toBe('anonymous')
                expect(data.modifiedBy).toBe('anonymous')
                expect(data.book_ID).toBe(201)
                expect(data.ID.length).toBe(36)
                expect(data.country_code).toBe(null)
                expect(data.amount).toBe(1)
                return fetch(`${basePath}/catalog/Orders(${data.ID})`, {
                    method: "DELETE"
                })
                    .then(response => {
                        expect(response.status).toBe(204)
                    })
            })
            .then(() => {
                return fetch(`${basePath}/catalog/Books(201)`)
                    .then(response => {
                        expect(response.status).toBe(200)
                        return response.json()
                    })
                    .then(data => {
                        expect(data.stock).toBe(11)
                    })
            })
    })

    // Test Orders endpoint (without UUID) with string ID for 400 status 
    it('gets /Orders with string id value to return 400 status', () => {
        return fetch(`${basePath}/catalog/Orders()`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({"book_ID": "whatever", "amount": 1})
            })
            .then(response => {
                expect(response.status).toBe(400)
                return response.json()
            })
            .then(data => {
                console.log(data)
                expect(data.error.code).toBe('400')
            })
    })

    // Test Orders endpoint (without UUID) with string amount for 400 status 
    it('gets /Orders with string amount value to return 400 status', () => {
        return fetch(`${basePath}/catalog/Orders()`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({"book_ID": 201, "amount": "whatever"})
            })
            .then(response => {
                expect(response.status).toBe(400)
                return response.json()
            })
            .then(data => {
                console.log(data)
                expect(data.error.code).toBe('400')
            })
    })

    
    // Get all orders in the database to test a single order with specified ID = 95ca0e2b-357c-46bb-bd50-b82d17cca0e5
    it('gets list of all logged /Orders for 200 status', () => {
        return fetch(`${basePath}/catalog/Orders`)
            .then(response => {
                expect(response.status).toBe(200)
                return response.json()
            })
            .then(data => {
                console.log(data)
                let singleOrder = data.value.find(order => order.ID === "95ca0e2b-357c-46bb-bd50-b82d17cca0e5")
                expect(singleOrder).toHaveProperty('createdAt')
                expect(singleOrder).toHaveProperty('modifiedAt')
                expect(singleOrder).toHaveProperty('createdBy')
                expect(singleOrder).toHaveProperty('modifiedBy')
                expect(singleOrder).toHaveProperty('book_ID')
                expect(singleOrder).toHaveProperty('ID')
                expect(singleOrder).toHaveProperty('country_code')
                expect(singleOrder).toHaveProperty('amount')
                expect(singleOrder.createdAt).toBeDefined()
                expect(singleOrder.modifiedAt).toBeDefined()
                expect(singleOrder.createdBy).toBe('anonymous')
                expect(singleOrder.modifiedBy).toBe('anonymous')
                expect(singleOrder.book_ID).toBe(201)
                expect(singleOrder.ID).toBe("95ca0e2b-357c-46bb-bd50-b82d17cca0e5")
                expect(singleOrder.country_code).toBe(null)
                expect(singleOrder.amount).toBe(1)
            })
    })

    // Test Orders endpoint (with UUID = 95ca0e2b-357c-46bb-bd50-b82d17cca0e5)
    it('gets Orders(95ca0e2b-357c-46bb-bd50-b82d17cca0e5) for 200 status', () => {
        return fetch(`${basePath}/catalog/Orders(95ca0e2b-357c-46bb-bd50-b82d17cca0e5)`)
            .then(response => {
                expect(response.status).toBe(200)
                return response.json()
            })
            .then(data => {
                console.log(data)
                expect(data).toHaveProperty('createdAt')
                expect(data).toHaveProperty('modifiedAt')
                expect(data).toHaveProperty('createdBy')
                expect(data).toHaveProperty('modifiedBy')
                expect(data).toHaveProperty('book_ID')
                expect(data).toHaveProperty('ID')
                expect(data).toHaveProperty('country_code')
                expect(data).toHaveProperty('amount')
                expect(data.createdAt).toBeDefined()
                expect(data.modifiedAt).toBeDefined()
                expect(data.createdBy).toBe('anonymous')
                expect(data.modifiedBy).toBe('anonymous')
                expect(data.book_ID).toBe(201)
                expect(data.ID).toBe('95ca0e2b-357c-46bb-bd50-b82d17cca0e5')
                expect(data.country_code).toBe(null)
                expect(data.amount).toBe(1)
            })
    })

    // Test Orders endpoint (with empty UUID)
    it('gets /Orders() with empty id value to return 400 status', () => {
        return fetch(`${basePath}/catalog/Orders()`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({"book_ID": 201, "amount": 1})
            })
            .then(response => {
                expect(response.status).toBe(400)
                return response.json()
            })
            .then(data => {
                console.log(data)
                expect(data.error.code).toBe('400')
            })
    })

})