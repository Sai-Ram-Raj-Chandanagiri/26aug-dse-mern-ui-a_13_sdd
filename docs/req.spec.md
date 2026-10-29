# Roundtable Requirements Document

## Epic

Roundtable is a social platform that allows users to create communities, join discussions, and share resources with others. It is a **MERN STACK** technology-based web application that is designed to cater to the needs of individuals who want to connect with like-minded people, share their thoughts, and engage in meaningful conversations.

The application is of professional complexity, and it offers a range of features that make it easy for users to interact with each other. The user interface is simple and intuitive, making it easy for even the most technologically challenged individuals to use the platform. Users can create their profiles, join communities, and participate in discussions on various topics.

**Key Features:**

- **Communities**: Users can create their own communities based on their interests and invite others to join. Communities can be public or private, depending on the user's preference.
- **Discussions**: Users can browse through the various communities and join discussions on topics that interest them. They can share their thoughts, ask questions, and engage in debates with other members of the community.
- **Resource Sharing**: Users can share articles, videos, and other resources that they find interesting or informative, allowing them to learn from each other and stay up-to-date on the latest trends and developments in their respective fields.

Roundtable is a powerful social platform designed to connect people, foster meaningful conversations, and facilitate the sharing of resources. Its MERN STACK technology-based web application ensures that it is fast, reliable, and easy to use.

---

## Overall Requirements

The web app shown in the reference video only shows the minimum requirements for the application. Aspects like web accessibility which leads to a better user experience, better error handling etc. should also be implemented. Your implementation of the Roundtable web app should be an improvisation of it.

1. Use GIT for code integration and management. At least one git push per trainee, per day is required.
2. Use Material Design components wherever necessary.
3. Add appropriate validations wherever necessary. For example, you should be validating that the trip start date is not before today.
4. Appropriate error messages should be provided for any such validations done above.
5. The Error or Success messages should be populated based on the requirement and should be appropriate.
6. There should not be any spelling or grammatical mistakes.
7. The website should have a uniform color theme.
8. Refer to the styles.css file for styling your web app.
9. Make web accessibility a part of your design and development. The reference video does not implement this.

---

## Product Backlog

### User Story - 1: Account Creation & Login

**Description**: As a new user, I should be able to create an account and login to the platform

**Story Points**: 5

#### MoSCoW Priority

**Must Have:**
1. User should be able to create a new account with a unique email and password
2. User should be able to login to the platform using their email and password

**Should Have:**
1. User should be able to reset their password if forgotten

#### Acceptance Criteria

**Positive Points (Dos):**
1. User should receive a confirmation email upon successful account creation
2. User should be redirected to their profile page upon successful login

**Negative Points (Don'ts):**
1. User should not be able to create an account with an existing email
2. User should not be able to login with incorrect credentials

---

### User Story - 2: Profile Management

**Description**: As a user, I should be able to create and manage my profile

**Story Points**: 3

#### MoSCoW Priority

**Must Have:**
1. User should be able to edit their profile information
2. User should be able to upload a profile picture

**Should Have:**
1. User should be able to view their activity on the platform

#### Acceptance Criteria

**Positive Points (Dos):**
1. User should be able to successfully update their profile information
2. User should be able to see their activity on the platform

**Negative Points (Don'ts):**
1. User should not be able to upload an image that exceeds the maximum size limit
2. User should not be able to edit their email address

---

### User Story - 3: Community Creation & Invitations

**Description**: As a user, I should be able to create a community and invite others to join

**Story Points**: 5

#### MoSCoW Priority

**Must Have:**
1. User should be able to create a new community
2. User should be able to invite others to join the community

**Should Have:**
1. User should be able to edit the community information

#### Acceptance Criteria

**Positive Points (Dos):**
1. User should be able to successfully create a new community
2. User should be able to invite others to join the community

**Negative Points (Don'ts):**
1. User should not be able to create a community with a name that already exists
2. User should not be able to invite a user who is already a member of the community

---

### User Story - 4: Community Participation

**Description**: As a user, I should be able to join a community and participate in discussions

**Story Points**: 5

#### MoSCoW Priority

**Must Have:**
1. User should be able to join a community
2. User should be able to participate in discussions

**Should Have:**
1. User should be able to search for communities based on keywords

#### Acceptance Criteria

**Positive Points (Dos):**
1. User should be able to successfully join a community
2. User should be able to participate in discussions

**Negative Points (Don'ts):**
1. User should not be able to join a private community without an invitation
2. User should not be able to participate in discussions if they are not a member of the community

---

### User Story - 5: Resource Sharing

**Description**: As a user, I should be able to share resources with others in a community

**Story Points**: 3

#### MoSCoW Priority

**Must Have:**
1. User should be able to share articles, videos, and other resources with others in a community

**Should Have:**
1. User should be able to view resources shared by others

#### Acceptance Criteria

**Positive Points (Dos):**
1. User should be able to successfully share resources with others in a community
2. User should be able to view resources shared by others

**Negative Points (Don'ts):**
1. User should not be able to share a resource that exceeds the maximum size limit
2. User should not be able to share inappropriate content

---

### User Story - 6: Admin Community & User Management

**Description**: As an admin, I should be able to manage communities and users

**Story Points**: 8

#### MoSCoW Priority

**Must Have:**
1. Admin should be able to delete communities and users

**Should Have:**
1. Admin should be able to edit community and user information

#### Acceptance Criteria

**Positive Points (Dos):**
1. Admin should be able to successfully delete communities and users
2. Admin should be able to edit community and user information

**Negative Points (Don'ts):**
1. Admin should not be able to delete a community with active discussions
2. Admin should not be able to edit a user's email address

---

### User Story - 7: Notifications

**Description**: As a user, I should be able to receive notifications for new discussions and resources in my communities

**Story Points**: 3

#### MoSCoW Priority

**Must Have:**
1. User should receive notifications for new discussions and resources in their communities

**Should Have:**
1. User should be able to manage their notification settings

#### Acceptance Criteria

**Positive Points (Dos):**
1. User should receive notifications for new discussions and resources in their communities
2. User should be able to manage their notification settings

**Negative Points (Don'ts):**
1. User should not receive notifications for discussions and resources in communities they have left
2. User should not be able to turn off all notifications

---

### User Story - 8: Search & Filter

**Description**: As a user, I should be able to search and filter discussions and resources within a community

**Story Points**: 3

#### MoSCoW Priority

**Must Have:**
1. User should be able to search discussions by keywords
2. User should be able to search resources by keywords

**Should Have:**
1. User should be able to filter resources by type (e.g., article, video)

#### Acceptance Criteria

**Positive Points (Dos):**
1. User should see relevant search results quickly
2. User should see a helpful message if no results are found

**Negative Points (Don'ts):**
1. User should not be able to search content in private communities they haven't joined

---

### User Story - 9: Likes & Upvotes

**Description**: As a user, I should be able to like or upvote discussions and resources

**Story Points**: 2

#### MoSCoW Priority

**Must Have:**
1. User should be able to like a discussion or shared resource
2. User should be able to see the total number of likes on a post

**Should Have:**
1. User should be able to remove their like (unlike)

#### Acceptance Criteria

**Positive Points (Dos):**
1. User should see immediate visual feedback when liking a post

**Negative Points (Don'ts):**
1. User should not be able to like the same post multiple times

---

### User Story - 10: Save & Bookmark

**Description**: As a user, I should be able to save or bookmark discussions and resources for later viewing

**Story Points**: 3

#### MoSCoW Priority

**Must Have:**
1. User should be able to save a discussion or resource
2. User should have a dedicated profile section to view their saved items

**Should Have:**
1. User should be able to remove items from their saved list

#### Acceptance Criteria

**Positive Points (Dos):**
1. User should be able to easily access their saved content from the navigation menu

**Negative Points (Don'ts):**
1. User should not see posts in their saved list if the original post has been deleted by an admin

---

### User Story - 11: Content Reporting

**Description**: As a user, I should be able to report inappropriate discussions or resources to the administrators

**Story Points**: 5

#### MoSCoW Priority

**Must Have:**
1. User should be able to flag a post, resource, or comment for review
2. Admin should be able to view a dashboard of all reported content

**Should Have:**
1. User should be able to select a reason for the report (e.g., spam, harassment)
2. Admin should be able to dismiss the report or remove the offending content

**Won't Have:**
1. Automated machine learning content moderation

#### Acceptance Criteria

**Positive Points (Dos):**
1. User should receive a confirmation message that their report has been submitted
2. Reported content should be temporarily hidden for the reporting user

**Negative Points (Don'ts):**
1. User should not be able to report the same piece of content multiple times
2. User should not be able to report their own content

---

### User Story - 12: Direct Messaging

**Description**: As a user, I should be able to send direct messages to other community members

**Story Points**: 8

#### MoSCoW Priority

**Must Have:**
1. User should be able to initiate a 1-on-1 private chat with another user
2. User should have an inbox to view their active conversations and message history

**Should Have:**
1. Messages should be delivered and updated in real-time (e.g., via WebSockets)
2. Users should see an unread message indicator/badge

**Won't Have:**
1. Group messaging or sending file attachments in messages

#### Acceptance Criteria

**Positive Points (Dos):**
1. Messages should be clearly ordered chronologically
2. UI should clearly distinguish between sent and received messages

**Negative Points (Don'ts):**
1. User should not be able to message someone who is not a member of their joined communities
2. User should not be able to send empty messages
