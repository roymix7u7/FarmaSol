package com.farmasol.backend.repository;

import com.farmasol.backend.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    Optional<Categoria> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Categoria> findByCategoriaPadreIsNullAndActivoTrueOrderByOrden();

    List<Categoria> findByActivoTrueOrderByOrden();

    List<Categoria> findByCategoriaPadre_Id(Long idPadre);

    boolean existsByCategoriaPadre_IdAndActivoTrue(Long idPadre);

    /** IDs de la categoría {@code idRaiz} y todas sus descendientes (CTE recursivo, MySQL 8). */
    @Query(value = """
            WITH RECURSIVE arbol AS (
                SELECT id_categoria FROM categorias WHERE id_categoria = :idRaiz
                UNION ALL
                SELECT c.id_categoria FROM categorias c
                JOIN arbol a ON c.id_categoria_padre = a.id_categoria
            )
            SELECT id_categoria FROM arbol
            """, nativeQuery = true)
    List<Long> findIdsSubarbol(@Param("idRaiz") Long idRaiz);

    /** IDs de la categoría {@code idHoja} y todos sus ancestros hasta la raíz. */
    @Query(value = """
            WITH RECURSIVE ancestros AS (
                SELECT id_categoria, id_categoria_padre FROM categorias WHERE id_categoria = :idHoja
                UNION ALL
                SELECT c.id_categoria, c.id_categoria_padre FROM categorias c
                JOIN ancestros a ON c.id_categoria = a.id_categoria_padre
            )
            SELECT id_categoria FROM ancestros
            """, nativeQuery = true)
    List<Long> findIdsAncestros(@Param("idHoja") Long idHoja);
}
