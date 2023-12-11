package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/google/uuid"
)

type MyEvent struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ResponseData struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func HandleRequest(ctx context.Context, request events.ALBTargetGroupRequest) (events.ALBTargetGroupResponse, error) {
	event := MyEvent{}
	err := json.Unmarshal([]byte(request.Body), &event)
	if err != nil {
		return events.ALBTargetGroupResponse{StatusCode: 400, StatusDescription: "400 Bad Request", Body: "Invalid request body"}, nil
	}

	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	}))

	svc := dynamodb.New(sess)

	currentTime := time.Now().UTC().Format(time.RFC3339)

	item := map[string]*dynamodb.AttributeValue{
		"ID": {
			S: aws.String(uuid.New().String()),
		},
		"Name": {
			S: aws.String(event.Name),
		},
		"Email": {
			S: aws.String(event.Email),
		},
		"Password": {
			S: aws.String(event.Password),
		},
		"CreatedAt": {
			S: aws.String(currentTime),
		},
		"UpdatedAt": {
			S: aws.String(currentTime),
		},
	}

	input := &dynamodb.PutItemInput{
		Item:         item,
		TableName:    aws.String("aws-dynamodb-users-table-use1-dev"),
		ReturnValues: aws.String("ALL_NEW"),
	}

	log.Printf("PutItemInput: %+v\n", input)

	output, err := svc.PutItem(input)
	if err != nil {
		return events.ALBTargetGroupResponse{
			StatusCode:        500,
			StatusDescription: "500 Internal Server Error",
			Headers:           map[string]string{"Content-Type": "application/json"},
			Body:              "Failed to create response body",
			IsBase64Encoded:   false,
		}, nil
	}

	responseData := ResponseData{
		ID:        *output.Attributes["ID"].S,
		Name:      *output.Attributes["Name"].S,
		Email:     *output.Attributes["Email"].S,
		CreatedAt: *output.Attributes["CreatedAt"].S,
		UpdatedAt: *output.Attributes["UpdatedAt"].S,
	}

	responseBody, err := json.Marshal(responseData)
	if err != nil {
		return events.ALBTargetGroupResponse{
			StatusCode:        500,
			StatusDescription: "500 Internal Server Error",
			Headers:           map[string]string{"Content-Type": "application/json"},
			Body:              "Failed to create response body",
			IsBase64Encoded:   false,
		}, nil
	}

	return events.ALBTargetGroupResponse{
		StatusCode:        200,
		StatusDescription: "200 OK",
		Headers:           map[string]string{"Content-Type": "application/json"},
		Body:              string(responseBody),
		IsBase64Encoded:   false,
	}, nil
}

func main() {
	lambda.Start(HandleRequest)
}
