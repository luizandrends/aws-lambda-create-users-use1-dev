import { ALBEvent, ALBResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'

const tableName = 'aws-dynamodb-users-table-use1-dev'
const client = new DynamoDBClient({ region: 'us-east-1' })

export const handleRequest = async (
  event: ALBEvent,
): Promise<ALBResult | undefined> => {
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

  const id = uuidv4()
  const createdAt = new Date().toISOString()
  const updatedAt = createdAt
  const hashedPassword = await bcrypt.hash(password, 10)

  const params = {
    TableName: tableName,
    Item: {
      id: { S: id },
      name: { S: name },
      email: { S: email },
      password: { S: hashedPassword },
      created_at: { S: createdAt },
      updated_at: { S: updatedAt },
    },
  }

  client
    .send(new PutCommand(params))
    .then(() => {
      console.log('PutCommand successful')
      return {
        statusCode: 200,
        statusDescription: '200 OK',
        body: JSON.stringify({ id, name, email }),
        isBase64Encoded: false,
      }
    })
    .catch(error => {
      console.error('Error with PutCommand:', error)
      return {
        statusCode: 500,
        statusDescription: '500 Internal Server Error',
        body: JSON.stringify({ message: 'Internal Server Error' }),
        isBase64Encoded: false,
      }
    })
}
