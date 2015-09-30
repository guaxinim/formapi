package br.com.guaxinim.backend;

import org.keycloak.KeycloakSecurityContext;
import org.keycloak.representations.AccessToken;

import javax.ejb.Stateless;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.List;

@Stateless
@Path("users")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class UserResource {

    @Context
    private HttpServletRequest httpRequest;

    @GET
    public List<String> getCustomers() {
        // Just to show how to user info from access token in REST endpoint
        KeycloakSecurityContext securityContext = (KeycloakSecurityContext) httpRequest.getAttribute(KeycloakSecurityContext.class.getName());
        AccessToken accessToken = securityContext.getToken();
        System.out.println(String.format("User '%s' with email '%s' made request to CustomerService REST endpoint", accessToken.getPreferredUsername(), accessToken.getEmail()));

        ArrayList<String> rtn = new ArrayList<String>();
        rtn.add("Bill Burke");
        rtn.add("Stian Thorgersen");
        rtn.add("Stan Silvert");
        rtn.add("Gabriel Cardoso");
        rtn.add("Viliam Rockai");
        rtn.add("Marek Posolda");
        rtn.add("Boleslaw Dawidowicz");
        return rtn;
    }
}
