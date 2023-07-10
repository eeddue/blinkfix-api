export const templateMailResetPassword = (code: string, name: string) => {
  let firstHalf = code.substring(0, 3); // 'abc'
  let secondHalf = code.substring(3, 6); // 'def'
  return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
              position: relative;
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              margin-top: 1rem;
            }
            h1 {
              color: #000000;
              text-align: center;
              margin: 30px 0;
            }
            p {
              margin: 20px 0;
              color: #000000;
              text-align: center;
            }
            a {
              color: #337ab7;
              font-weight: bold;
            }
            .button {
              display: inline-block;
              border-radius: 4px;
              background-color: #337ab7;
              color: #000000;
              text-decoration: none;
              padding: 10px 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #000000;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              border-radius: 4px;
              padding: 30px;
            }
            .code {
              margin: 20px 0;
              color: #000000;
              text-align: center;
              font-size: 3rem;
              font-weight: 900;
              white-space: 1em;
              letter-spacing: 1rem;
            }
            img {
              align-self: center;
              width: 50%;
              justify-self: center;
              display: flex;
            }
          </style>
        </head>
        <body>
          <img src="cid:logoImage@blink@fix.me" />
          <h1>Reset Your Password</h1>
          <p>Hi there ${name},</p>
          <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
          <p>To reset your password, Use this code in app:</p>
          <p class="code">${firstHalf}-${secondHalf}</p>
          <p>
            Thanks,
            <br />
            Blink Fix team
          </p>
        </body>
      </html>
`;
};
