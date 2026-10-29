package com.farmasol.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

/**
 * Genera y valida los JWT de la aplicación. El token lleva los datos necesarios para
 * reconstruir el {@link UsuarioAutenticado} sin tocar la base de datos.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;
    private final String issuer;

    public JwtService(
            @Value("${farmasol.jwt.secret}") String secret,
            @Value("${farmasol.jwt.expiration-ms}") long expirationMs,
            @Value("${farmasol.jwt.issuer}") String issuer) {
        this.key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret));
        this.expirationMs = expirationMs;
        this.issuer = issuer;
    }

    public String generarToken(TipoUsuario tipo, Long uid, String usuario, String rol, String nombre) {
        Date ahora = new Date();
        Date expira = new Date(ahora.getTime() + expirationMs);
        return Jwts.builder()
                .issuer(issuer)
                .subject(usuario)
                .claim("tipo", tipo.name())
                .claim("uid", uid)
                .claim("rol", rol)
                .claim("nombre", nombre)
                .issuedAt(ahora)
                .expiration(expira)
                .signWith(key)
                .compact();
    }

    /**
     * Valida firma y expiración y devuelve el principal. Lanza {@code JwtException}
     * (runtime) si el token es inválido.
     */
    public UsuarioAutenticado parsear(String token) {
        Claims c = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return new UsuarioAutenticado(
                TipoUsuario.valueOf(c.get("tipo", String.class)),
                c.get("uid", Long.class),
                c.getSubject(),
                c.get("rol", String.class),
                c.get("nombre", String.class));
    }
}
