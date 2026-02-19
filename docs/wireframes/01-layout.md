# Wireframe: Shared Layout

All pages in the Social Production app share a common layout structure built on flexbox.

## Page Structure

```
+--------------------------+
| Top Bar (flex 1)         |
+--------------------------+
| Content Wrapper (flex 3) |
+--------------------------+
```

The page is divided into two vertical sections. The Top Bar occupies a smaller portion (`flex: 1`) and the Content Wrapper takes the remaining space (`flex: 3`).

---

## Top Bar

- **Max height**: 48px
- **Display**: flex, row, space-between

```
+---------------+-----------------------+-------------------------+
| Logo (flex 1) | Page Actions (flex 3) | Global Actions (flex 1) |
+---------------+-----------------------+-------------------------+
```

### Logo (flex 1)

Application logo/branding, left-aligned. Links to the front page.

### Page Actions (flex 3)

Center section — content varies by page. See individual page wireframes for details.

### Global Actions (flex 1)

Right-aligned actions that change based on authentication state.

#### Logged Out

```
+---------------+----------------+
| Log In Button | Sign Up Button |
+---------------+----------------+
```

| Element         | Type   | Notes                          |
| --------------- | ------ | ------------------------------ |
| Log In Button   | Button | Opens login flow               |
| Sign Up Button  | Button | Opens registration flow        |

#### Logged In

```
+--------------------+---------------------------+----------------+
| Alerts Icon Button | Notifications Icon Button | Log Out Button |
+--------------------+---------------------------+----------------+
```

| Element                    | Type        | Notes                             |
| -------------------------- | ----------- | --------------------------------- |
| Alerts Icon Button         | Icon Button | Shows unread alert badge/count    |
| Notifications Icon Button  | Icon Button | Shows unread notification count   |
| Log Out Button             | Button      | Ends the session                  |

---

## Content Wrapper

```
+-----------------+------------------+-----------------+
| Padding (flex 1)| Content (flex 3) | Padding (flex 1)|
+-----------------+------------------+-----------------+
```

The content wrapper centers the main content area (`flex: 3`) with equal padding columns on each side (`flex: 1` each). This creates a responsive, centered layout.

The **Content** area is page-specific. See individual page wireframes.
