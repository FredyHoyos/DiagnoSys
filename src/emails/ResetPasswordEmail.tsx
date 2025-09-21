import {
    Body,
    Button,
    Container,
    Head,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
    userFirstname?: string;
    resetPasswordLink: string;
}

export const ResetPasswordEmail = ({
    userFirstname = "User",
    resetPasswordLink,
}: ResetPasswordEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Reset your password</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Img
                        src="https://diagno-sys-psi.vercel.app/favicon.ico"
                        width="80"
                        height="80"
                        alt="DiagnoSys Logo"
                    />
                    <Section>
                        <Text style={text}>Hello {userFirstname},</Text>
                        <Text style={text}>
                            We received a request to reset your password. If this was you,
                            please click the button below:
                        </Text>
                        <Button style={button} href={resetPasswordLink}>
                            Reset Password
                        </Button>
                        <Text style={text}>
                            If you did not request this change, please ignore this email.
                        </Text>
                        <Text style={text}>
                            For security reasons, this link will expire in <b>15 minutes</b>.
                        </Text>
                        <Text style={text}>Thank you for using our application 🙌</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default ResetPasswordEmail;

const main = { backgroundColor: "#f6f9fc", padding: "20px 0" };

const container = {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e5e5",
    padding: "40px",
    borderRadius: "8px",
};

const text = {
    fontFamily: "Helvetica, Arial, sans-serif",
    fontWeight: "300",
    color: "#404040",
    fontSize: "14px",
    lineHeight: "24px",
};

const button = {
    backgroundColor: "#2E6347",
    borderRadius: "6px",
    color: "#ffffff",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: "15px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    width: "220px",
    paddingTop: "12px",
    paddingBottom: "12px",
    margin: "20px auto",
};
