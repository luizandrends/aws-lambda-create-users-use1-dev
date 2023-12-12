import { ALBEvent, ALBResult } from 'aws-lambda'

import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

const tableName = 'aws-dynamodb-users-table-use1-dev'

const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' })
const client = DynamoDBDocument.from(dynamoDbClient)

export const handleRequest = async (event: ALBEvent): Promise<ALBResult> => {
  const { name, email, password } = JSON.parse(event.body || '{}')

  if (!name || !email || !password) {
    return {
      statusCode: 400,
      statusDescription: '400 Bad Request',
      body: JSON.stringify({
        message: 'name, email and password are required',
      }),
      isBase64Encoded: false,
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      statusCode: 400,
      statusDescription: '400 Bad Request',
      body: JSON.stringify({
        message: 'Invalid email format',
      }),
      isBase64Encoded: false,
    }
  }

  const id = uuidv4()
  const createdAt = new Date().toISOString()
  const updatedAt = createdAt
  const hashedPassword = await bcrypt.hash(password, 10)

  const findUserByEmailParams = {
    TableName: tableName,
    Key: { id, email },
  }

  try {
    const { Item } = await client.send(new GetCommand(findUserByEmailParams))

    if (Item) {
      return {
        statusCode: 400,
        statusDescription: '400 Bad Request',
        body: JSON.stringify({ message: 'email already exists' }),
        isBase64Encoded: false,
      }
    }
  } catch (error) {
    console.log('Error with GetCommand:', error)
    return {
      statusCode: 500,
      statusDescription: '500 Internal Server Error',
      body: JSON.stringify({ message: 'Internal Server Error' }),
      isBase64Encoded: false,
    }
  }

  const createUserParams = {
    TableName: tableName,
    Item: {
      id: id,
      name: name,
      email: email,
      password: hashedPassword,
      created_at: createdAt,
      updated_at: updatedAt,
    },
  }

  try {
    await client.send(new PutCommand(createUserParams))
    console.log('PutCommand successful')
    return {
      statusCode: 200,
      statusDescription: '200 OK',
      body: JSON.stringify({ id, name, email }),
      isBase64Encoded: false,
    }
  } catch (error) {
    console.error('Error with PutCommand:', error)
    return {
      statusCode: 500,
      statusDescription: '500 Internal Server Error',
      body: JSON.stringify({ message: 'Internal Server Error' }),
      isBase64Encoded: false,
    }
  }
}
