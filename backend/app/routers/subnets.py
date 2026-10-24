from fastapi import APIRouter, HTTPException, status
from ..schemas.calculator import SubnetCalculateRequest, SubnetCalculateResponse
from ..services.subnet_calc import calculate_subnet

router = APIRouter(prefix="/subnets", tags=["subnets"])


@router.post(
    "/calculate",
    response_model=SubnetCalculateResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate IPv4 Subnet Details",
    description="Calculates network, broadcast, masks, usable host range and capacity adhering to RFC conventions."
)
def calculate_subnet_endpoint(payload: SubnetCalculateRequest) -> SubnetCalculateResponse:
    try:
        if payload.cidr:
            result = calculate_subnet(payload.cidr)
        elif payload.ip:
            if payload.prefix is not None:
                result = calculate_subnet(payload.ip, payload.prefix)
            elif payload.netmask:
                result = calculate_subnet(payload.ip, payload.netmask)
            else:
                result = calculate_subnet(payload.ip)
        else:
            raise ValueError("Either CIDR notation or IP address must be supplied.")

        return SubnetCalculateResponse(
            cidr=result.cidr,
            ip=result.ip,
            prefix=result.prefix,
            netmask=result.netmask,
            wildcard_mask=result.wildcard_mask,
            network_address=result.network_address,
            broadcast_address=result.broadcast_address,
            total_addresses=result.total_addresses,
            usable_addresses=result.usable_addresses,
            usable_range_start=result.usable_range_start,
            usable_range_end=result.usable_range_end,
            usable_range=result.usable_range,
            network_bits=result.network_bits,
            host_bits=result.host_bits,
            binary_netmask=result.binary_netmask,
            binary_network=result.binary_network,
            special_notes=result.special_notes,
            is_private=result.is_private,
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subnet calculation error: {str(exc)}"
        )
