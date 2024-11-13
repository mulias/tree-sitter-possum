package tree_sitter_possum_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_possum "github.com/mulias/possum_parser_language/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_possum.Language())
	if language == nil {
		t.Errorf("Error loading Possum grammar")
	}
}
