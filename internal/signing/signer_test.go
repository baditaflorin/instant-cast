package signing

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestSignerRoundTrip(t *testing.T) {
	signer := New("01234567890123456789012345678901")
	token, err := signer.Sign("blob-1", time.Now().Add(time.Hour))
	require.NoError(t, err)

	claims, err := signer.Verify(token)
	require.NoError(t, err)
	require.Equal(t, "blob-1", claims.ID)
}

func TestSignerRejectsTampering(t *testing.T) {
	signer := New("01234567890123456789012345678901")
	token, err := signer.Sign("blob-1", time.Now().Add(time.Hour))
	require.NoError(t, err)

	_, err = signer.Verify(token + "x")
	require.ErrorIs(t, err, ErrInvalidToken)
}
