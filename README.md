# We.js comments plugin

Add comments to We.js project

## Configuration

[project]/config/local.js

```
    // ...
    latestCommentLimit: 3,// limit for preloaded comments
    comments: {
      models:  {
        // enable comments in models:
        post: true,
        article: true,
        cfnews: true
      }
    }
    // ...
```

## Installation

```sh
we i we-plugin-comment
```

## Features

### Widgets

#### comment-form

Add comments in any record with widgets interface

### Helpers:

#### comments

Add comments programaticaly in any record template

```hbs
{{{comments modelName="post" modelId=record.id comments=record.metadata.comments count=record.metadata.commentCount locals=this}}}
```

## License

[the MIT license](https://github.com/wejs/we-core/blob/master/LICENSE.md).

## Sponsored by

- Linky: https://linkysystems.com
